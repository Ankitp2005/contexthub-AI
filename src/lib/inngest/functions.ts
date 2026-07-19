import { inngest } from "./client";
import { db } from "@/lib/db";
import { repositories, github_installations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateRepositorySyncState } from "@/domains/github/repositories";
import { getInstallationAccessToken } from "@/domains/github/services";
import { listRepositoryPullRequests, listPullRequestFiles } from "@/domains/github/services/pull-requests";
import { fetchRepositoryCommitStats } from "@/domains/github/services/commits";
import { fetchRepositoryDependencies } from "@/domains/github/services/dependencies";
import { upsertPullRequest, clearPullRequestFiles, storePullRequestFiles } from "@/domains/github/repositories/pull-requests";
import { runRiskPipeline } from "@/domains/risk/services/pipeline";
import { parseCodeownersFile } from "@/domains/ownership/services";
import { syncOwnershipRules } from "@/domains/ownership/repositories";
import { computeOwnershipScores } from "@/domains/ownership/services/confidence";
import { syncCommitActivity, getCommitActivity, syncImplicitOwnership } from "@/domains/ownership/repositories/commit-activity";
import { syncDependencyEdges } from "@/domains/engineering/repositories";

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

export async function performDirectSync(repositoryId: string, organizationId: string) {
  // 1. Fetch repository record
  const repoRecord = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!repoRecord) {
    throw new Error(`Repository ${repositoryId} not found in database`);
  }

  // 2. Fetch github installation record
  const installation = await db
    .select()
    .from(github_installations)
    .where(eq(github_installations.organization_id, organizationId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!installation) {
    await updateRepositorySyncState(repositoryId, null, new Date());
    throw new Error(`GitHub Installation not found for org ${organizationId}`);
  }

  const [owner, repoName] = repoRecord.full_name.split("/") as [string, string];

  try {
    // 3. Get installation token
    const token = await getInstallationAccessToken(installation.github_installation_id);

    // 4. Fetch latest CODEOWNERS file and sync rules
    const codeownersContent = await fetchCodeOwners(token, owner, repoName);
    const rules = codeownersContent ? parseCodeownersFile(codeownersContent) : [];
    await syncOwnershipRules(repositoryId, rules);

    // 5. Sync dependency manifest (package.json / go.mod / etc.)
    const edges = await fetchRepositoryDependencies(token, owner, repoName);
    await syncDependencyEdges(organizationId, repositoryId, edges);

    // 6. Sync commit activity + compute implicit ownership
    const stats = await fetchRepositoryCommitStats(token, owner, repoName, 100);
    await syncCommitActivity(repositoryId, stats);

    const activityRows = await getCommitActivity(repositoryId);
    const scores = computeOwnershipScores(activityRows, 3);
    await syncImplicitOwnership(repositoryId, scores);

    // 6. Fetch recent/all Pull Requests (so we sync closed/merged PRs as well)
    const pulls = await listRepositoryPullRequests(
      installation.github_installation_id,
      owner,
      repoName,
      "all"
    );

    // 6. Sync each Pull Request
    for (const pr of pulls) {
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
    }

    // 7. Successful sync - release lock and update last_scanned_at
    await updateRepositorySyncState(repositoryId, null, new Date());

    return { success: true, prCount: pulls.length };
  } catch (err) {
    // Release lock on error
    await updateRepositorySyncState(repositoryId, null, new Date());
    throw err;
  }
}

export const scanRepository = inngest.createFunction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { id: "scan-repository", triggers: [{ event: "repository.scan" }] } as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { repositoryId, organizationId } = event.data;

    try {
      const result = await step.run("run-direct-sync", async () => {
        return performDirectSync(repositoryId, organizationId);
      });
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Scan failed: ${errMsg}`);
    }
  }
);
