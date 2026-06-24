/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "./client";
import { db } from "@/lib/db";
import { repositories, github_installations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateRepositorySyncState } from "@/domains/github/repositories";
import { getInstallationAccessToken } from "@/domains/github/services";
import { listRepositoryPullRequests, listPullRequestFiles } from "@/domains/github/services/pull-requests";
import { upsertPullRequest, clearPullRequestFiles, storePullRequestFiles } from "@/domains/github/repositories/pull-requests";
import { runRiskPipeline } from "@/domains/risk/services/pipeline";
import { parseCodeownersFile } from "@/domains/ownership/services";
import { syncOwnershipRules } from "@/domains/ownership/repositories";

// CODEOWNERS fetching via GitHub Contents API
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

export const scanRepository = inngest.createFunction(
  { id: "scan-repository", triggers: [{ event: "repository.scan" }] } as any,
  async ({ event, step }: any) => {
    const { repositoryId, organizationId } = event.data;

    // 1. Fetch repository record
    const repoRecord = await step.run("fetch-repo-db", async () => {
      const results = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId))
        .limit(1);
      return results[0] ?? null;
    });

    if (!repoRecord) {
      throw new Error(`Repository ${repositoryId} not found in database`);
    }

    // 2. Fetch github installation record
    const installation = await step.run("fetch-installation-db", async () => {
      const results = await db
        .select()
        .from(github_installations)
        .where(eq(github_installations.organization_id, organizationId))
        .limit(1);
      return results[0] ?? null;
    });

    if (!installation) {
      await updateRepositorySyncState(repositoryId, null, new Date());
      throw new Error(`GitHub Installation not found for org ${organizationId}`);
    }

    const [owner, repoName] = repoRecord.full_name.split("/") as [string, string];

    try {
      // 3. Get installation token
      const token = await step.run("get-github-token", async () => {
        return getInstallationAccessToken(installation.github_installation_id);
      });

      // 4. Fetch latest CODEOWNERS file and sync rules
      const codeownersContent = await step.run("fetch-codeowners", async () => {
        return fetchCodeOwners(token, owner, repoName);
      });

      await step.run("sync-codeowners-rules", async () => {
        const rules = codeownersContent ? parseCodeownersFile(codeownersContent) : [];
        await syncOwnershipRules(repositoryId, rules);
      });

      // 5. Fetch recent/open Pull Requests
      const pulls = await step.run("fetch-open-prs", async () => {
        return listRepositoryPullRequests(
          installation.github_installation_id,
          owner,
          repoName,
          "open"
        );
      });

      // 6. Sync each Pull Request
      for (const pr of pulls) {
        await step.run(`sync-pr-${pr.number}`, async () => {
          // Upsert PR metadata
          const prRecord = await upsertPullRequest({
            id: crypto.randomUUID(),
            repository_id: repoRecord.id,
            github_pr_id: pr.id,
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            state: pr.state,
          });

          // Fetch changed files for this PR
          const files = await listPullRequestFiles(
            installation.github_installation_id,
            owner,
            repoName,
            pr.number
          );

          // Clear & store files in DB
          await clearPullRequestFiles(prRecord.id);
          await storePullRequestFiles(prRecord.id, files);

          // Run risk scoring pipeline for the PR
          await runRiskPipeline({
            installationId: installation.github_installation_id,
            owner,
            repo: repoName,
            prNumber: pr.number,
            prAuthor: pr.user.login,
            prHtmlUrl: pr.html_url,
            files,
            pullRequestId: prRecord.id,
            headSha: pr.head.sha,
          });
        });
      }

      // 7. Successful sync - release lock and update last_scanned_at
      await step.run("release-lock-success", async () => {
        await updateRepositorySyncState(repositoryId, null, new Date());
      });

      return { success: true, prCount: pulls.length };
    } catch (err) {
      // Release lock on error
      await step.run("release-lock-error", async () => {
        await updateRepositorySyncState(repositoryId, null, new Date());
      });
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Scan failed for repository ${repoRecord.full_name}: ${errMsg}`);
    }
  }
);
