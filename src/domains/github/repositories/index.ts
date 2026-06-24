// github domain — repositories (data access layer)

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  github_installations,
  organizations,
  repositories,
} from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export async function findOrCreateOrganization(clerkUserId: string) {
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, clerkUserId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!;
  }

  const [org] = await db
    .insert(organizations)
    .values({
      id: clerkUserId,
      name: "My Organization",
      slug: clerkUserId,
      plan: "free",
    })
    .returning();

  return org!;
}

// ---------------------------------------------------------------------------
// GitHub Installations
// ---------------------------------------------------------------------------

export async function findInstallationByGitHubId(
  githubInstallationId: number
) {
  const results = await db
    .select()
    .from(github_installations)
    .where(
      eq(github_installations.github_installation_id, githubInstallationId)
    )
    .limit(1);

  return results[0] ?? null;
}

export async function findInstallationByOrganizationId(
  organizationId: string
) {
  const results = await db
    .select()
    .from(github_installations)
    .where(eq(github_installations.organization_id, organizationId))
    .limit(1);

  return results[0] ?? null;
}


export async function createInstallation(data: {
  id: string;
  organization_id: string;
  github_installation_id: number;
  account_name: string;
}) {
  const [installation] = await db
    .insert(github_installations)
    .values(data)
    .returning();

  return installation!;
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export async function findRepositoryByGitHubId(githubRepoId: number) {
  const results = await db
    .select()
    .from(repositories)
    .where(eq(repositories.github_repo_id, githubRepoId))
    .limit(1);

  return results[0] ?? null;
}

export async function findRepositoryById(id: string) {
  const results = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .limit(1);

  return results[0] ?? null;
}

export async function upsertRepository(data: {
  id: string;
  organization_id: string;
  github_repo_id: number;
  name: string;
  full_name: string;
  default_branch: string;
  visibility: string;
}) {
  const existing = await findRepositoryByGitHubId(data.github_repo_id);

  if (existing) {
    return existing;
  }

  const [repo] = await db.insert(repositories).values(data).returning();

  return repo!;
}

export async function listRepositoriesByOrganization(organizationId: string) {
  return db
    .select()
    .from(repositories)
    .where(eq(repositories.organization_id, organizationId));
}

export async function deleteRepositoryByGitHubId(githubRepoId: number) {
  return db
    .delete(repositories)
    .where(eq(repositories.github_repo_id, githubRepoId));
}

export async function deleteInstallationByGitHubId(githubInstallationId: number) {
  return db
    .delete(github_installations)
    .where(eq(github_installations.github_installation_id, githubInstallationId));
}

export async function updateRepositorySyncState(
  id: string,
  syncingAt: Date | null,
  lastScannedAt?: Date | null
) {
  const updateData: Record<string, unknown> = {
    syncing_at: syncingAt,
    updated_at: new Date(),
  };
  if (lastScannedAt !== undefined) {
    updateData.last_scanned_at = lastScannedAt;
  }
  const [updated] = await db
    .update(repositories)
    .set(updateData)
    .where(eq(repositories.id, id))
    .returning();
  return updated ?? null;
}
