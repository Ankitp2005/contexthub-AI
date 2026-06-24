// src/domains/ownership/repositories/commit-activity.ts
//
// Database access layer for commit_activity and implicit_ownership tables.

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { commit_activity, implicit_ownership } from "@/lib/db/schema";
import { CommitFileStat } from "@/domains/github/services/commits";
import { OwnershipScore } from "../services/confidence";

// ---------------------------------------------------------------------------
// commit_activity helpers
// ---------------------------------------------------------------------------

/**
 * Clears all commit activity rows for a repository, then bulk-inserts the
 * fresh batch. Runs inside a transaction to ensure atomicity.
 */
export async function syncCommitActivity(
  repositoryId: string,
  stats: CommitFileStat[]
): Promise<void> {
  await db.transaction(async (tx) => {
    // Clear existing rows for this repository
    await tx
      .delete(commit_activity)
      .where(eq(commit_activity.repository_id, repositoryId));

    if (stats.length === 0) return;

    // Aggregate: group identical (authorLogin, filePath) pairs so we don't
    // insert thousands of individual rows for large repos.
    const aggregated = new Map<
      string,
      { additions: number; deletions: number; commits: number; lastDate: string }
    >();

    for (const stat of stats) {
      const key = `${stat.authorLogin}:::${stat.filePath}`;
      const existing = aggregated.get(key) ?? {
        additions: 0,
        deletions: 0,
        commits: 0,
        lastDate: stat.committedAt,
      };
      aggregated.set(key, {
        additions: existing.additions + stat.additions,
        deletions: existing.deletions + stat.deletions,
        commits: existing.commits + 1,
        lastDate:
          stat.committedAt > existing.lastDate
            ? stat.committedAt
            : existing.lastDate,
      });
    }

    const rows = Array.from(aggregated.entries()).map(([key, val]) => {
      const [authorLogin, filePath] = key.split(":::") as [string, string];
      return {
        id: crypto.randomUUID(),
        repository_id: repositoryId,
        file_path: filePath,
        author_login: authorLogin,
        commit_count: val.commits,
        additions: val.additions,
        deletions: val.deletions,
        last_committed_at: new Date(val.lastDate),
      };
    });

    // Insert in chunks of 500 to avoid parameter limits
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await tx.insert(commit_activity).values(rows.slice(i, i + CHUNK));
    }
  });
}

/**
 * Returns all commit activity rows for a given repository.
 */
export async function getCommitActivity(repositoryId: string) {
  return db
    .select()
    .from(commit_activity)
    .where(eq(commit_activity.repository_id, repositoryId));
}

// ---------------------------------------------------------------------------
// implicit_ownership helpers
// ---------------------------------------------------------------------------

/**
 * Replaces all implicit ownership records for a repository with a fresh batch.
 */
export async function syncImplicitOwnership(
  repositoryId: string,
  scores: OwnershipScore[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(implicit_ownership)
      .where(eq(implicit_ownership.repository_id, repositoryId));

    if (scores.length === 0) return;

    const rows = scores.map((s) => ({
      id: crypto.randomUUID(),
      repository_id: repositoryId,
      file_path: s.filePath,
      owner_login: s.ownerLogin,
      confidence_score: s.confidenceScore.toFixed(2),
      commit_count: s.commitCount,
      total_commits: s.totalCommits,
      computed_at: sql`now()`,
    }));

    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await tx.insert(implicit_ownership).values(rows.slice(i, i + CHUNK));
    }
  });
}

/**
 * Returns implicit ownership records for a specific file within a repository.
 * Ordered by confidence_score DESC.
 */
export async function getImplicitOwnersForFile(
  repositoryId: string,
  filePath: string
) {
  return db
    .select()
    .from(implicit_ownership)
    .where(
      sql`${implicit_ownership.repository_id} = ${repositoryId}
          AND ${implicit_ownership.file_path} = ${filePath}`
    )
    .orderBy(sql`${implicit_ownership.confidence_score} DESC`);
}
