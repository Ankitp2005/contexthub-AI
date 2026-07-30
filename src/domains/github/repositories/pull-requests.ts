import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  pull_requests,
  pull_request_files,
  repositories,
  risk_assessments,
  risk_factors,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Repositories lookup
// ---------------------------------------------------------------------------

export async function findRepositoryByGitHubRepoId(githubRepoId: number) {
  const results = await db
    .select()
    .from(repositories)
    .where(eq(repositories.github_repo_id, githubRepoId))
    .limit(1);

  return results[0] ?? null;
}

// ---------------------------------------------------------------------------
// Pull Requests
// ---------------------------------------------------------------------------

export async function findPullRequestByGitHubPrId(githubPrId: number) {
  const results = await db
    .select()
    .from(pull_requests)
    .where(eq(pull_requests.github_pr_id, githubPrId))
    .limit(1);

  return results[0] ?? null;
}

export async function upsertPullRequest(data: {
  id: string;
  repository_id: string;
  github_pr_id: number;
  number: number;
  title: string;
  author: string;
  state: string;
}) {
  const existing = await findPullRequestByGitHubPrId(data.github_pr_id);

  if (existing) {
    const [updated] = await db
      .update(pull_requests)
      .set({
        title: data.title,
        state: data.state,
        updated_at: new Date(),
      })
      .where(eq(pull_requests.github_pr_id, data.github_pr_id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(pull_requests)
    .values(data)
    .returning();

  return created!;
}

// ---------------------------------------------------------------------------
// Pull Request Files
// ---------------------------------------------------------------------------

export async function clearPullRequestFiles(pullRequestId: string) {
  return db
    .delete(pull_request_files)
    .where(eq(pull_request_files.pull_request_id, pullRequestId));
}

export async function storePullRequestFiles(
  pullRequestId: string,
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>
) {
  if (files.length === 0) return [];

  const values = files.map((file) => ({
    id: crypto.randomUUID(),
    pull_request_id: pullRequestId,
    file_path: file.filename,
    change_type: file.status,
    additions: file.additions,
    deletions: file.deletions,
  }));

  return db.insert(pull_request_files).values(values).returning();
}

/**
 * Atomically replaces all files for a pull request in a single transaction.
 * Prevents race conditions when concurrent webhooks fire for the same PR.
 */
export async function replacePullRequestFiles(
  pullRequestId: string,
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(pull_request_files)
      .where(eq(pull_request_files.pull_request_id, pullRequestId));

    if (files.length === 0) return;

    const values = files.map((file) => ({
      id: crypto.randomUUID(),
      pull_request_id: pullRequestId,
      file_path: file.filename,
      change_type: file.status,
      additions: file.additions,
      deletions: file.deletions,
    }));

    await tx.insert(pull_request_files).values(values);
  });
}

export async function listPullRequestsWithAssessmentsForOrganization(
  organizationId: string
) {
  // 1. Get PRs for the org's repos, joined with their latest risk assessment
  const prs = await db
    .select({
      pr: pull_requests,
      repository: repositories,
      assessment: risk_assessments,
    })
    .from(pull_requests)
    .innerJoin(repositories, eq(pull_requests.repository_id, repositories.id))
    .leftJoin(risk_assessments, eq(risk_assessments.pull_request_id, pull_requests.id))
    .where(eq(repositories.organization_id, organizationId))
    .orderBy(desc(pull_requests.updated_at));

  if (prs.length === 0) return [];

  // 2. Fetch risk factors for all assessments
  const assessmentIds = prs
    .map((p) => p.assessment?.id)
    .filter((id): id is string => !!id);

  const factors = assessmentIds.length > 0
    ? await db
        .select()
        .from(risk_factors)
        .where(inArray(risk_factors.risk_assessment_id, assessmentIds))
    : [];

  // 3. Map factors back to the prs
  return prs.map((p) => ({
    ...p,
    factors: factors.filter((f) => f.risk_assessment_id === p.assessment?.id),
  }));
}
