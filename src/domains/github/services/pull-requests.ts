/* eslint-disable @typescript-eslint/no-explicit-any */
import { getInstallationAccessToken } from "./index";
import type { GitHubPRFile } from "../types";
import { fetchPaginatedArray } from "./pagination";

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

  return fetchPaginatedArray<GitHubPRFile>(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    bearerHeaders(token),
  );
}

export async function listRepositoryPullRequests(
  installationId: number,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<any[]> {
  const token = await getInstallationAccessToken(installationId);

  return fetchPaginatedArray(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}`,
    bearerHeaders(token),
  );
}
