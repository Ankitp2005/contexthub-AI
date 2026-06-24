// mcp domain — tools
// Implements the 3 MCP tools defined in docs/mcp_spec.md.
//
// Rules (from mcp_spec.md and agent-rulebook.md):
//  - MCP must NEVER contain business logic.
//  - MCP only delegates to existing domain services/repositories.
//  - MCP must NEVER access the database directly for scoring.
//  - Only return domain DTOs — never raw DB records.
//  - Exactly 3 tools: score_change, get_ownership, get_constraints.

import { scoreRisk } from "../../risk/services/engine";
import { explainRiskAssessment } from "../../risk/services/explainer";
import type { RiskInput } from "../../risk/types";
import { getFileOwnership } from "../../ownership/services";
import { getApplicableConstraints } from "../../constraints/services";
import { getConstraintsForOrganization } from "../../constraints/repositories";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ownership_rules,
  repositories,
} from "@/lib/db/schema";
import type {
  ScoreChangeResult,
  GetOwnershipResult,
  GetConstraintsResult,
} from "../types";
import type {
  ScoreChangeInput,
  GetOwnershipInput,
  GetConstraintsInput,
} from "../schemas";

// ---------------------------------------------------------------------------
// Pure helpers — no I/O, no side-effects, fully testable
// ---------------------------------------------------------------------------

/**
 * countChangedLines — Counts lines in a unified diff that are additions or
 * deletions. Lines beginning with "+" or "-" are counted; the "+++" / "---"
 * file-header lines are included but consistent across tool and dashboard use.
 *
 * Pure function: identical diff always produces identical count.
 */
export function countChangedLines(diff: string): number {
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+") || line.startsWith("-"))
    .length;
}

/**
 * detectOwnershipMismatch — Returns true when at least one of the changed
 * files matches an ownership rule pattern for this repository.
 *
 * Matching logic (mirrors CODEOWNERS semantics, simplified for MCP v1):
 *   - "*"             matches any file
 *   - "/src/payments" matches any file whose path contains "src/payments"
 *
 * Pure function: identical inputs always produce identical output.
 */
export function detectOwnershipMismatch(
  files: string[],
  ownershipRows: Array<{ path_pattern: string }>
): boolean {
  if (ownershipRows.length === 0) return false;
  return files.some((file) =>
    ownershipRows.some((rule) => {
      if (rule.path_pattern === "*") return true;
      // Strip glob wildcards and leading slash so "/src/payments/*" → "src/payments"
      const normalized = rule.path_pattern.replace(/\*/g, "").replace(/^\//, "");
      return file.includes(normalized);
    })
  );
}

/**
 * buildRiskInputFromContext — Constructs a RiskInput from the raw MCP tool
 * signals and DB-loaded context.
 *
 * This is the canonical mapping used by both the MCP tool and the dashboard.
 * Calling scoreRisk(buildRiskInputFromContext(ctx)) is guaranteed to produce
 * the same score as the tool — there is no hidden logic elsewhere.
 *
 * Pure function: no I/O, no randomness, identical inputs → identical output.
 */
export function buildRiskInputFromContext(ctx: {
  files: string[];
  diff: string;
  ownershipRows: Array<{ path_pattern: string }>;
  hasDeploymentConstraints: boolean;
}): RiskInput {
  return {
    ownershipMismatch: detectOwnershipMismatch(ctx.files, ctx.ownershipRows),
    criticalPathCount: 0,        // MCP v1: inferred in a future phase
    deploymentConstraintActive: ctx.hasDeploymentConstraints,
    hasRecentIncident: false,    // MCP v1: inferred in a future phase
    changedFiles: ctx.files.length,
    changedLines: countChangedLines(ctx.diff),
    directDependentCount: 0,     // MCP v1: agents can call get_blast_radius for this
  };
}

// ---------------------------------------------------------------------------
// Tool 1: score_change
// ---------------------------------------------------------------------------

/**
 * scoreChange — Evaluates the risk of a proposed code change.
 *
 * Steps:
 *   1. Load ownership context for the repository from ownership_rules.
 *   2. Load deployment constraints for the owning organisation.
 *   3. Build a RiskInput via buildRiskInputFromContext (pure, no logic here).
 *   4. Delegate scoring to scoreRisk() — the single source of scoring truth.
 *   5. Generate a human-readable summary via explainRiskAssessment().
 *
 * The score is 100% determined by scoreRisk(). The explainer cannot change it.
 */
export async function scoreChange(
  input: ScoreChangeInput
): Promise<ScoreChangeResult> {
  const { repositoryId, files, diff } = input;

  // Step 1 — Load ownership rules for this repository
  const ownershipRows = await db
    .select()
    .from(ownership_rules)
    .where(eq(ownership_rules.repository_id, repositoryId));

  // Step 2 — Load deployment constraints via the owning organisation
  const repoRows = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  const repo = repoRows[0];
  let hasDeploymentConstraints = false;

  if (repo) {
    const constraints = await getConstraintsForOrganization(repo.organization_id);
    hasDeploymentConstraints = constraints.length > 0;
  }

  // Step 3 — Construct RiskInput using the canonical pure helper
  const riskInput = buildRiskInputFromContext({
    files,
    diff,
    ownershipRows,
    hasDeploymentConstraints,
  });

  // Step 4 — Delegate to the risk engine (no scoring logic in MCP)
  const result = scoreRisk(riskInput);

  // Step 5 — Generate human-readable summary (cannot change the score)
  const explanation = await explainRiskAssessment({
    score: result.score,
    level: result.level,
    factors: result.factors,
  });

  return {
    score: result.score,
    level: result.level,
    factors: result.factors.map((f) => ({ name: f.name, weight: f.weight })),
    summary: explanation.summary,
  };
}

// ---------------------------------------------------------------------------
// Tool 2: get_ownership
// ---------------------------------------------------------------------------

/**
 * getOwnership — Returns ownership information for a file path.
 *
 * Queries the ownership_rules table for rules matching the given file path.
 * Returns the first matching rule. If no match, returns "none".
 */
export async function getOwnership(
  input: GetOwnershipInput
): Promise<GetOwnershipResult> {
  const { repositoryId, filePath } = input;
  return getFileOwnership(repositoryId, filePath);
}

// ---------------------------------------------------------------------------
// Tool 3: get_constraints
// ---------------------------------------------------------------------------

/**
 * getConstraints — Returns deployment constraints relevant to a scope.
 *
 * Loads all deployment_constraints for the organisation that owns the
 * given repository. Filters by scope when provided.
 */
export async function getConstraints(
  input: GetConstraintsInput
): Promise<GetConstraintsResult> {
  const { repositoryId, scope } = input;
  const constraints = await getApplicableConstraints(repositoryId, scope);
  return { constraints };
}
