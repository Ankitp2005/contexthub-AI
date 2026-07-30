import type { GitHubPullRequestWebhookPayload } from "../types";
import {
  findRepositoryByGitHubRepoId,
  upsertPullRequest,
  replacePullRequestFiles,
} from "../repositories/pull-requests";
import { listPullRequestFiles } from "./pull-requests";
import { runRiskPipeline } from "@/domains/risk/services/pipeline";

export async function handlePullRequestEvent(
  payload: GitHubPullRequestWebhookPayload
) {
  const { pull_request: pr, repository, action } = payload;

  // 1. Look up repository record
  const repoRecord = await findRepositoryByGitHubRepoId(repository.id);
  if (!repoRecord) {
    console.warn(
      `[PR Ingestion] Repository ${repository.full_name} (github_id=${repository.id}) not found. Skipping.`
    );
    return;
  }

  // 2. Upsert PR metadata
  const prRecord = await upsertPullRequest({
    id: crypto.randomUUID(),
    repository_id: repoRecord.id,
    github_pr_id: pr.id,
    number: pr.number,
    title: pr.title,
    author: pr.user.login,
    state: pr.state,
  });

  console.log(
    `[PR Ingestion] Upserted PR #${pr.number} (${action}) in ${repository.full_name}`
  );

  // 3. Sync files and trigger risk pipeline for actionable events
  if (action === "opened" || action === "synchronize" || action === "reopened") {
    const [owner, repoName] = repository.full_name.split("/") as [string, string];

    // Find the installation to get an access token
    const installation = await db_findInstallationByOrgId(repoRecord.organization_id);

    if (!installation) {
      console.warn(
        `[PR Ingestion] No installation found for org ${repoRecord.organization_id}. Skipping file sync + risk scoring.`
      );
      return;
    }

    // Fetch changed files from GitHub
    const files = await listPullRequestFiles(
      installation.github_installation_id,
      owner,
      repoName,
      pr.number
    );

    // Atomically replace files in a transaction
    await replacePullRequestFiles(prRecord.id, files);

    console.log(
      `[PR Ingestion] Stored ${files.length} files for PR #${pr.number}`
    );

    // 4. Fire risk pipeline — async, does not block webhook response
    void runRiskPipeline({
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
}

// ---------------------------------------------------------------------------
// Internal helper — find any installation for the org
// ---------------------------------------------------------------------------
import { db } from "@/lib/db";
import { github_installations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function db_findInstallationByOrgId(organizationId: string) {
  const results = await db
    .select()
    .from(github_installations)
    .where(eq(github_installations.organization_id, organizationId))
    .limit(1);

  return results[0] ?? null;
}
