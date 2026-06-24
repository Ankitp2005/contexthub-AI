// API Route: GitHub App installation callback
// GET /api/github/callback?installation_id=xxx&setup_action=install

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getInstallationDetails,
  listInstallationRepositories,
} from "@/domains/github/services";
import {
  findOrCreateOrganization,
  findInstallationByGitHubId,
  createInstallation,
  upsertRepository,
  listRepositoriesByOrganization,
  deleteRepositoryByGitHubId,
} from "@/domains/github/repositories";
import { validateInstallationId } from "@/domains/github/schemas";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const searchParams = request.nextUrl.searchParams;

  let installationId: number;
  try {
    installationId = validateInstallationId(
      searchParams.get("installation_id")
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_installation", request.url)
    );
  }

  try {
    // 1. Find or create the organization for this user
    const organization = await findOrCreateOrganization(userId);

    // 2. Skip if installation already recorded
    const existingInstallation =
      await findInstallationByGitHubId(installationId);

    if (existingInstallation) {
      // Prevent cross-tenant hijacking of existing installations
      if (existingInstallation.organization_id !== organization.id) {
        console.error(
          `[GitHub Callback] Installation hijacking attempt: installation_id=${installationId} belongs to org=${existingInstallation.organization_id}, requested by user=${userId} (org=${organization.id})`
        );
        return NextResponse.redirect(
          new URL("/dashboard?error=installation_belongs_to_other_org", request.url)
        );
      }
    } else {
      // 3. Get installation details from GitHub (account name)
      const details = await getInstallationDetails(installationId);

      // 4. Persist installation
      await createInstallation({
        id: crypto.randomUUID(),
        organization_id: organization.id,
        github_installation_id: installationId,
        account_name: details.account.login,
      });
    }

    // 5. Discover and sync repositories
    const repos = await listInstallationRepositories(installationId);
    const activeRepoIds = new Set(repos.map((r) => r.id));

    // Get all existing repos for this organization
    const existingRepos = await listRepositoriesByOrganization(organization.id);

    // Delete any repositories that are no longer in the active list
    for (const existing of existingRepos) {
      if (!activeRepoIds.has(existing.github_repo_id)) {
        await deleteRepositoryByGitHubId(existing.github_repo_id);
      }
    }

    // Upsert active repositories
    for (const repo of repos) {
      await upsertRepository({
        id: crypto.randomUUID(),
        organization_id: organization.id,
        github_repo_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        default_branch: repo.default_branch,
        visibility: repo.visibility ?? (repo.private ? "private" : "public"),
      });
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard?success=github_connected&repos=${repos.length}`,
        request.url
      )
    );
  } catch (error) {
    console.error("[github/callback] Installation error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=installation_failed", request.url)
    );
  }
}
