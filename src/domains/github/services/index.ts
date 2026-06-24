// github domain — services

import { createSign } from "node:crypto";
import type {
  GitHubAccessTokenResponse,
  GitHubInstallation,
  GitHubInstallationRepositoriesResponse,
  GitHubRepository,
} from "../types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

// ---------------------------------------------------------------------------
// JWT generation for GitHub App authentication
// Uses node:crypto — no additional dependencies required
// ---------------------------------------------------------------------------

function base64url(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateGitHubAppJWT(): string {
  const appId = process.env.GITHUB_APP_ID;
  let privateKey = process.env.GITHUB_APP_PRIVATE_KEY ?? "";

  // Strip wrapping double or single quotes that might be injected by deployment environments
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  // Replace literal \n or escaped newlines with real newlines
  privateKey = privateKey.replace(/\\n/g, "\n").trim();

  if (!appId || !privateKey) {
    throw new Error(
      "GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set"
    );
  }

  const now = Math.floor(Date.now() / 1000);

  const header = base64url(
    Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  );
  const payload = base64url(
    Buffer.from(
      JSON.stringify({
        iat: now - 60, // issued 60s ago to account for clock drift
        exp: now + 300, // 5 min — GitHub max is 10min but clock skew causes issues at the limit
        iss: parseInt(appId, 10), // GitHub requires numeric App ID
      })
    )
  );

  const data = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  const signature = base64url(sign.sign(privateKey));

  return `${data}.${signature}`;
}

// ---------------------------------------------------------------------------
// GitHub App API calls
// ---------------------------------------------------------------------------

function githubHeaders(token: string, type: "jwt" | "bearer"): HeadersInit {
  return {
    Authorization: `${type === "jwt" ? "Bearer" : "token"} ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "ContextHub-AI",
  };
}

export async function getInstallationDetails(
  installationId: number
): Promise<GitHubInstallation> {
  const jwt = generateGitHubAppJWT();

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}`,
    { headers: githubHeaders(jwt, "jwt") }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to get installation details: ${response.status} ${response.statusText} — ${body}`
    );
  }

  return response.json() as Promise<GitHubInstallation>;
}

export async function getInstallationAccessToken(
  installationId: number
): Promise<string> {
  const jwt = generateGitHubAppJWT();

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: githubHeaders(jwt, "jwt"),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to get installation access token: ${response.status} ${response.statusText} — ${body}`
    );
  }

  const data = (await response.json()) as GitHubAccessTokenResponse;
  return data.token;
}

export async function listInstallationRepositories(
  installationId: number
): Promise<GitHubRepository[]> {
  const token = await getInstallationAccessToken(installationId);

  const response = await fetch(
    `${GITHUB_API_BASE}/installation/repositories?per_page=100`,
    { headers: githubHeaders(token, "bearer") }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to list repositories: ${response.status} ${response.statusText}`
    );
  }

  const data =
    (await response.json()) as GitHubInstallationRepositoriesResponse;
  return data.repositories;
}

export * from "./pr-comment";
export * from "./check-runs";
export * from "./pull-requests";

