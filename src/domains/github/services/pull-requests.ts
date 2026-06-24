/* eslint-disable @typescript-eslint/no-explicit-any */
import { getInstallationAccessToken } from "./index";
import type { GitHubPRFile } from "../types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

function bearerHeaders(token: string): HeadersInit {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "ContextHub-AI",
  };
}

export async function listPullRequestFiles(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPRFile[]> {
  const token = await getInstallationAccessToken(installationId);

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
    { headers: bearerHeaders(token) }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to list PR files: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<GitHubPRFile[]>;
}

export async function listRepositoryPullRequests(
  installationId: number,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<any[]> {
  const token = await getInstallationAccessToken(installationId);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}&per_page=50`,
    { headers: bearerHeaders(token) }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to list PRs for repository ${owner}/${repo}: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<any[]>;
}
