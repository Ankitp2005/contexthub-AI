// src/domains/mcp/services/implicit-ownership.ts
//
// MCP service layer for the get_implicit_ownership tool.
//
// Reads pre-computed implicit ownership scores from the DB.
// Never reads raw PR data or calls the GitHub API — all scores are already
// computed by the deterministic Ownership Confidence Engine during scan jobs.

import { z } from "zod";
import { db } from "@/lib/db";
import { implicit_ownership } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ownership_rules } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const GetImplicitOwnershipInputSchema = z.object({
  repositoryId: z.string().min(1, "repositoryId is required"),
  filePath: z.string().min(1, "filePath is required"),
});

export type GetImplicitOwnershipInput = z.infer<
  typeof GetImplicitOwnershipInputSchema
>;

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface ImplicitOwnerEntry {
  ownerLogin: string;
  confidenceScore: number;
  commitCount: number;
  totalCommits: number;
  source: "implicit";
}

export interface GetImplicitOwnershipResult {
  repositoryId: string;
  filePath: string;
  /** Highest-confidence implicit owners (up to 3), ordered by score DESC */
  implicitOwners: ImplicitOwnerEntry[];
  /** CODEOWNERS-declared owner if present (source of truth when confidence is high) */
  explicitOwner: string | null;
  /** true if no CODEOWNERS rule matches and top implicit confidence < 60 */
  unowned: boolean;
}

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------

export async function getImplicitOwnership(
  input: GetImplicitOwnershipInput
): Promise<GetImplicitOwnershipResult> {
  const { repositoryId, filePath } = input;

  // 1. Fetch implicit ownership rows for this file (top 3 by confidence)
  const implicitRows = await db
    .select()
    .from(implicit_ownership)
    .where(
      sql`${implicit_ownership.repository_id} = ${repositoryId}
          AND ${implicit_ownership.file_path} = ${filePath}`
    )
    .orderBy(sql`${implicit_ownership.confidence_score} DESC`)
    .limit(3);

  // 2. Fetch CODEOWNERS-declared owner for this file
  const codeownersRules = await db
    .select()
    .from(ownership_rules)
    .where(eq(ownership_rules.repository_id, repositoryId));

  // Find the last matching CODEOWNERS pattern (CODEOWNERS precedence rules)
  let explicitOwner: string | null = null;
  const normalizedFilePath = filePath.startsWith("/")
    ? filePath.slice(1)
    : filePath;

  for (let i = codeownersRules.length - 1; i >= 0; i--) {
    const rule = codeownersRules[i]!;
    const pattern = rule.path_pattern === "*"
      ? "*"
      : rule.path_pattern.replace(/\*/g, "").replace(/^\//, "");

    const matches =
      pattern === "*" ||
      normalizedFilePath.startsWith(pattern) ||
      normalizedFilePath.includes(pattern);

    if (matches) {
      explicitOwner = rule.owner_name;
      break;
    }
  }

  // 3. Build result
  const owners: ImplicitOwnerEntry[] = implicitRows.map((row) => ({
    ownerLogin: row.owner_login,
    confidenceScore: parseFloat(row.confidence_score),
    commitCount: row.commit_count,
    totalCommits: row.total_commits,
    source: "implicit" as const,
  }));

  const topConfidence = owners[0]?.confidenceScore ?? 0;
  const unowned = explicitOwner === null && topConfidence < 60;

  return {
    repositoryId,
    filePath,
    implicitOwners: owners,
    explicitOwner,
    unowned,
  };
}
