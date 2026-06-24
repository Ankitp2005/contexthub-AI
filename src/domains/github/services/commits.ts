// src/domains/github/services/commits.ts
//
// Fetches commit and file-change statistics from the GitHub API.
// Used by the Inngest scan job to populate commit_activity for the
// Ownership Confidence Engine.

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "ContextHub-AI",
  };
}

export interface CommitFileStat {
  /** GitHub login of the commit author */
  authorLogin: string;
  /** File path within the repository */
  filePath: string;
  additions: number;
  deletions: number;
  /** ISO 8601 timestamp of the commit */
  committedAt: string;
}

interface GitHubCommitSummary {
  sha: string;
  commit: {
    author: { name: string; date: string } | null;
  };
  author: { login: string } | null;
}

interface GitHubCommitDetail {
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
  }>;
}

/**
 * Fetches the last `maxCommits` commits for a repository and returns a flat
 * list of per-file, per-author statistics.
 *
 * @param token  GitHub installation access token
 * @param owner  Repository owner (org or user)
 * @param repo   Repository name
 * @param maxCommits  Number of recent commits to inspect (default 100)
 */
export async function fetchRepositoryCommitStats(
  token: string,
  owner: string,
  repo: string,
  maxCommits = 100
): Promise<CommitFileStat[]> {
  // 1. List recent commits (paginated — GitHub max per_page is 100)
  const commitsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${Math.min(maxCommits, 100)}`;
  const commitsRes = await fetch(commitsUrl, { headers: githubHeaders(token) });

  if (!commitsRes.ok) {
    console.warn(
      `[Commits] Failed to list commits for ${owner}/${repo}: ${commitsRes.status}`
    );
    return [];
  }

  const commits = (await commitsRes.json()) as GitHubCommitSummary[];
  const stats: CommitFileStat[] = [];

  // 2. Fetch file-level detail for each commit (sequential to respect rate limits)
  for (const commit of commits) {
    const authorLogin = commit.author?.login ?? commit.commit.author?.name ?? "unknown";
    const committedAt = commit.commit.author?.date ?? new Date().toISOString();

    try {
      const detailRes = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${commit.sha}`,
        { headers: githubHeaders(token) }
      );

      if (!detailRes.ok) continue;

      const detail = (await detailRes.json()) as GitHubCommitDetail;

      for (const file of detail.files ?? []) {
        stats.push({
          authorLogin,
          filePath: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          committedAt,
        });
      }
    } catch {
      // Best-effort: skip commits that fail individually
    }
  }

  return stats;
}
