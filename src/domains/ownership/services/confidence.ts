// src/domains/ownership/services/confidence.ts
//
// Ownership Confidence Engine
//
// Analyzes raw commit activity stats to compute a confidence score for each
// author/file pair.
//
// Scoring formula (from PRD § Step 5):
//   confidence = (author_commits_on_file / total_commits_on_file) * 100
//
// A secondary tie-break weight is applied for line volume:
//   line_weight = (author_lines_on_file / total_lines_on_file) * 100
//
// Final score = 0.7 * commit_share + 0.3 * line_share   (clamped 0 – 100)
//
// Security: This service operates only on pre-fetched, sanitized DB rows.
// It never reads raw PR data or calls external APIs directly.

export interface CommitActivityRow {
  author_login: string;
  file_path: string;
  commit_count: number;
  additions: number;
  deletions: number;
}

export interface OwnershipScore {
  filePath: string;
  ownerLogin: string;
  confidenceScore: number; // 0 – 100, two decimal places
  commitCount: number;
  totalCommits: number;
}

/**
 * Computes the top-N implicit owners for every unique file_path found in the
 * provided commit activity rows.
 *
 * @param rows     Raw commit activity records for a repository
 * @param topN     How many candidates to return per file (default 3)
 */
export function computeOwnershipScores(
  rows: CommitActivityRow[],
  topN = 3
): OwnershipScore[] {
  if (rows.length === 0) return [];

  // --- Group by file_path -------------------------------------------------
  type AuthorStats = {
    commits: number;
    lines: number; // additions + deletions
  };
  const byFile = new Map<string, Map<string, AuthorStats>>();

  for (const row of rows) {
    let authorMap = byFile.get(row.file_path);
    if (!authorMap) {
      authorMap = new Map();
      byFile.set(row.file_path, authorMap);
    }

    const existing = authorMap.get(row.author_login) ?? { commits: 0, lines: 0 };
    authorMap.set(row.author_login, {
      commits: existing.commits + row.commit_count,
      lines: existing.lines + row.additions + row.deletions,
    });
  }

  // --- Compute scores per file -------------------------------------------
  const results: OwnershipScore[] = [];

  for (const [filePath, authorMap] of byFile) {
    let totalCommits = 0;
    let totalLines = 0;

    for (const stats of authorMap.values()) {
      totalCommits += stats.commits;
      totalLines += stats.lines;
    }

    // Score every author, then take the top-N
    const candidates: OwnershipScore[] = [];

    for (const [login, stats] of authorMap) {
      const commitShare =
        totalCommits > 0 ? (stats.commits / totalCommits) * 100 : 0;
      const lineShare =
        totalLines > 0 ? (stats.lines / totalLines) * 100 : commitShare;

      const raw = 0.7 * commitShare + 0.3 * lineShare;
      const confidenceScore = Math.min(100, Math.max(0, parseFloat(raw.toFixed(2))));

      candidates.push({
        filePath,
        ownerLogin: login,
        confidenceScore,
        commitCount: stats.commits,
        totalCommits,
      });
    }

    // Sort descending by confidence, take top N
    candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
    results.push(...candidates.slice(0, topN));
  }

  return results;
}

/**
 * Finds the single highest-confidence owner for a specific file path
 * from a pre-computed list of scores.
 */
export function getPrimaryOwner(
  scores: OwnershipScore[],
  filePath: string
): OwnershipScore | null {
  const candidates = scores
    .filter((s) => s.filePath === filePath)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  return candidates[0] ?? null;
}
