// risk domain — pipeline
// Orchestrates the full risk assessment flow for a pull request:
//   1. Fetch CODEOWNERS from GitHub (optional)
//   2. Build deterministic RiskInput from PR data
//   3. Score risk (engine.ts — no AI)
//   4. Persist risk assessment to DB (repositories/index.ts)
//   5. Explain risk (explainer.ts — LLM with fallback)
//   6. Post PR comment (pr-comment.ts)
//   7. Send Slack alert if score >= threshold (slack.ts)

import type { GitHubPRFile } from "@/domains/github/types";
import { scoreRisk, isCriticalPath, isSensitiveDataPath } from "./engine";
import { explainRiskAssessment } from "./explainer";
import { sendSlackAlert } from "./slack";
import { publishRiskComment } from "@/domains/github/services/pr-comment";
import { getInstallationAccessToken } from "@/domains/github/services";
import { createCheckRun } from "@/domains/github/services/check-runs";
import {
  storeRiskAssessment,
  deleteRiskAssessmentsByPullRequestId,
} from "@/domains/risk/repositories";
import type { RiskInput } from "../types";
import { db } from "@/lib/db";
import { pull_requests, repositories, dependency_graph } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseCodeownersFile } from "@/domains/ownership/services";
import { syncOwnershipRules } from "@/domains/ownership/repositories";
import { getConstraintsForOrganization } from "@/domains/constraints/repositories";
import { getRecentIncidentServicesForOrganization } from "@/domains/incidents/repositories";

// ---------------------------------------------------------------------------
// Critical path matching uses shared engine helpers.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CODEOWNERS parsing
// Supports the standard GitHub CODEOWNERS format:
//   <pattern>  @owner1  @owner2  team@example.com
// Last matching rule wins (GitHub semantics).
// ---------------------------------------------------------------------------

interface CodeOwnerRule {
  pattern: string;
  owners: string[];
}

function parseCodeOwners(content: string): CodeOwnerRule[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split(/\s+/);
      return {
        pattern: parts[0]!,
        owners: parts.slice(1).map((o) => o.toLowerCase()),
      };
    });
}

function pathMatchesPattern(filePath: string, pattern: string): boolean {
  // Normalize: strip leading slash
  const p = pattern.replace(/^\//, "");

  if (p === "*" || p === "**") return true;

  // Directory prefix pattern (e.g. "src/payments/")
  if (p.endsWith("/")) {
    return filePath.startsWith(p);
  }

  // Extension wildcard (e.g. "*.ts")
  if (p.startsWith("*.")) {
    return filePath.endsWith(p.slice(1));
  }

  // Glob wildcard in middle (e.g. "src/**/*.ts") — simplified: prefix match
  const prefix = p.split("*")[0];
  if (prefix && p.includes("*")) {
    return filePath.startsWith(prefix);
  }

  // Exact file or directory prefix
  return filePath === p || filePath.startsWith(p + "/");
}

function getOwnersForFiles(
  rules: CodeOwnerRule[],
  filePaths: string[]
): string[] {
  const allOwners = new Set<string>();

  for (const filePath of filePaths) {
    // GitHub CODEOWNERS: last matching rule wins
    let matched: string[] = [];
    for (const rule of rules) {
      if (pathMatchesPattern(filePath, rule.pattern)) {
        matched = rule.owners;
      }
    }
    matched.forEach((o) => allOwners.add(o));
  }

  return Array.from(allOwners);
}

// ---------------------------------------------------------------------------
// CODEOWNERS fetching via GitHub Contents API
// Checks common locations: root, .github/, docs/
// ---------------------------------------------------------------------------

async function fetchCodeOwners(
  token: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const GITHUB_API_BASE = "https://api.github.com";
  const GITHUB_API_VERSION = "2022-11-28";

  const candidates = [
    "CODEOWNERS",
    ".github/CODEOWNERS",
    "docs/CODEOWNERS",
  ];

  for (const path of candidates) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
            "User-Agent": "ContextHub-AI",
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as { content: string };
        // GitHub returns content as base64 with newlines — strip them before decoding
        const cleaned = data.content.replace(/\n/g, "");
        return Buffer.from(cleaned, "base64").toString("utf-8");
      }
    } catch {
      // Try next path
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// RiskInput construction
// ---------------------------------------------------------------------------

function buildRiskInput(
  files: GitHubPRFile[],
  prAuthor: string,
  codeownersContent: string | null,
  deploymentConstraintActive: boolean,
  hasRecentIncident: boolean,
  directDependentCount = 0
): RiskInput {
  const changedFiles = files.length;
  const changedLines = files.reduce(
    (sum, f) => sum + f.additions + f.deletions,
    0
  );

  // Critical path: count individual files matching sensitive keywords
  const criticalPathCount = files.filter((f) =>
    isCriticalPath(f.filename)
  ).length;

  // Sensitive data exposure: check if any file touches sensitive data keywords
  const sensitiveDataExposure = files.some((f) =>
    isSensitiveDataPath(f.filename)
  );

  // Ownership mismatch via CODEOWNERS
  let ownershipMismatch = false;
  if (codeownersContent) {
    const rules = parseCodeOwners(codeownersContent);
    const filePaths = files.map((f) => f.filename);
    const owners = getOwnersForFiles(rules, filePaths);

    if (owners.length > 0) {
      const authorLower = prAuthor.toLowerCase();
      ownershipMismatch = !owners.some(
        (o) => o === authorLower || o === `@${authorLower}`
      );
    }
  }

  return {
    ownershipMismatch,
    criticalPathCount,
    deploymentConstraintActive,
    hasRecentIncident,
    changedFiles,
    changedLines,
    directDependentCount,
    sensitiveDataExposure,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RunRiskPipelineInput {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prAuthor: string;
  prHtmlUrl: string;
  files: GitHubPRFile[];
  /** Internal UUID of the pull_requests DB row — used for assessment persistence. */
  pullRequestId: string;
  headSha: string;
}

/**
 * runRiskPipeline — Full risk assessment orchestration for a single PR.
 *
 * Designed to be fire-and-forget from the webhook handler:
 *   void runRiskPipeline(input);
 *
 * All errors are caught internally — this function never throws so that
 * the webhook can always return 200 to GitHub.
 */
export async function runRiskPipeline(
  input: RunRiskPipelineInput
): Promise<void> {
  const { installationId, owner, repo, prNumber, prAuthor, prHtmlUrl, files, pullRequestId, headSha } =
    input;

  const label = `${owner}/${repo}#${prNumber}`;
  console.log(`[Risk Pipeline] 🚀 Starting for ${label}`);

  try {
    // 1. Installation access token for GitHub API calls
    const token = await getInstallationAccessToken(installationId);

    // 2. Fetch CODEOWNERS — optional, gracefully absent
    const codeownersContent = await fetchCodeOwners(token, owner, repo);
    console.log(
      `[Risk Pipeline] CODEOWNERS: ${codeownersContent ? "found" : "not found"}`
    );

    // Sync CODEOWNERS to DB
    const prRows = await db
      .select({ repository_id: pull_requests.repository_id })
      .from(pull_requests)
      .where(eq(pull_requests.id, pullRequestId))
      .limit(1);
    const prRecord = prRows[0];
    let databaseConstraintActive = false;
    let hasRecentIncident = false;
    let directDependentCount = 0;

    if (prRecord) {
      const repositoryId = prRecord.repository_id;
      const rules = codeownersContent ? parseCodeownersFile(codeownersContent) : [];
      await syncOwnershipRules(repositoryId, rules);
      console.log(
        `[Risk Pipeline] 💾 Synced ${rules.length} CODEOWNERS rules to DB for repository ${repositoryId}`
      );

      // Evaluate direct dependents count
      const depRows = await db
        .select()
        .from(dependency_graph)
        .where(eq(dependency_graph.dependent_repository_id, repositoryId));
      directDependentCount = depRows.length;

      // Evaluate database deployment constraints
      const repoRows = await db
        .select({ organization_id: repositories.organization_id })
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);
      const repoRecord = repoRows[0];
      if (repoRecord) {
        const constraints = await getConstraintsForOrganization(repoRecord.organization_id);
        databaseConstraintActive = constraints.some((c) => {
          const scopeLower = c.scope.toLowerCase();
          if (scopeLower === "*" || scopeLower === "global") {
            return true;
          }
          if (scopeLower === repo.toLowerCase() || scopeLower === `${owner}/${repo}`.toLowerCase()) {
            return true;
          }
          return files.some((f) => {
            const filePathLower = f.filename.toLowerCase();
            return filePathLower.startsWith(scopeLower) || filePathLower.includes(scopeLower);
          });
        });

        // Evaluate database incidents
        const recentIncidentServices = await getRecentIncidentServicesForOrganization(repoRecord.organization_id);
        hasRecentIncident = recentIncidentServices.some((serviceName) => {
          const serviceNameLower = serviceName.toLowerCase();
          return files.some((f) => {
            const filePathLower = f.filename.toLowerCase();
            return filePathLower.includes(serviceNameLower);
          });
        });
        if (hasRecentIncident) {
          console.log(`[Risk Pipeline] ⚠️ Recent incident service matches touched files. hasRecentIncident set to true.`);
        }
      }
    } else {
      console.warn(
        `[Risk Pipeline] ⚠️ Pull request ${pullRequestId} not found. Skipping CODEOWNERS sync.`
      );
    }

    const deploymentConstraintActive = process.env.DEPLOYMENT_FREEZE === "true" || databaseConstraintActive;

    // 3. Build risk input from PR data
    const riskInput = buildRiskInput(
      files,
      prAuthor,
      codeownersContent,
      deploymentConstraintActive,
      hasRecentIncident,
      directDependentCount
    );
    console.log(`[Risk Pipeline] Input:`, JSON.stringify(riskInput));

    // 4. Deterministic risk score
    const assessment = scoreRisk(riskInput);
    console.log(
      `[Risk Pipeline] Score: ${assessment.score}/10 (${assessment.level}), factors: ${assessment.factors.length}`
    );

    // 5. Persist risk assessment to DB (clear stale + insert fresh)
    await deleteRiskAssessmentsByPullRequestId(pullRequestId);
    const stored = await storeRiskAssessment(pullRequestId, assessment);
    console.log(`[Risk Pipeline] 💾 Assessment stored: id=${stored.assessment.id}`);

    // 6. LLM explanation (falls back to template if OpenAI not configured)
    const { summary, aiGenerated } = await explainRiskAssessment({
      score: assessment.score,
      level: assessment.level,
      factors: assessment.factors,
    });
    console.log(
      `[Risk Pipeline] Explanation generated (AI=${aiGenerated})`
    );

    // 7. Post PR comment
    const comment = await publishRiskComment({
      installationId,
      owner,
      repo,
      prNumber,
      assessment,
      explanation: summary,
    });
    console.log(`[Risk Pipeline] ✅ Comment posted: ${comment.htmlUrl}`);

    // 7.5. Create GitHub Check Run
    try {
      const checkRun = await createCheckRun({
        installationId,
        owner,
        repo,
        headSha,
        riskScore: assessment.score,
        riskLevel: assessment.level,
        summary: summary,
      });
      console.log(`[Risk Pipeline] ✅ Check run created: ${checkRun.htmlUrl}`);
    } catch (checkErr) {
      console.error(`[Risk Pipeline] ⚠️ Failed to create check run:`, checkErr);
    }

    // 8. Slack alert (no-op if SLACK_WEBHOOK_URL not set or score < threshold)
    const slackSent = await sendSlackAlert({
      score: assessment.score,
      level: assessment.level,
      repoFullName: `${owner}/${repo}`,
      prNumber,
      prUrl: prHtmlUrl,
      factors: assessment.factors,
    });
    if (slackSent) {
      console.log(`[Risk Pipeline] 📣 Slack alert sent`);
    }
  } catch (error) {
    // Never throw — webhook must always return 200 to GitHub
    console.error(`[Risk Pipeline] ❌ Error for ${label}:`, error);
  }
}
