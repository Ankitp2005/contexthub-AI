import {
  findInstallationByGitHubId,
  upsertRepository,
  deleteRepositoryByGitHubId,
  deleteInstallationByGitHubId,
} from "../repositories";
import type {
  GitHubInstallationRepositoriesEvent,
  GitHubInstallationEvent,
} from "../types";

export async function handleInstallationRepositoriesEvent(
  payload: GitHubInstallationRepositoriesEvent
) {
  const installationId = payload.installation.id;
  const installation = await findInstallationByGitHubId(installationId);

  if (!installation) {
    console.warn(`[GitHub Webhook] Installation ${installationId} not found. Skipping repository sync.`);
    return;
  }

  const orgId = installation.organization_id;

  if (payload.repositories_added && payload.repositories_added.length > 0) {
    for (const repo of payload.repositories_added) {
      await upsertRepository({
        id: crypto.randomUUID(),
        organization_id: orgId,
        github_repo_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        default_branch: repo.default_branch || "main",
        visibility: repo.visibility ?? (repo.private ? "private" : "public"),
      });
      console.log(`[GitHub Webhook] Added repository ${repo.full_name}`);
    }
  }

  if (payload.repositories_removed && payload.repositories_removed.length > 0) {
    for (const repo of payload.repositories_removed) {
      await deleteRepositoryByGitHubId(repo.id, orgId);
      console.log(`[GitHub Webhook] Removed repository ${repo.full_name}`);
    }
  }
}

export async function handleInstallationEvent(payload: GitHubInstallationEvent) {
  if (payload.action === "deleted") {
    const installation = await findInstallationByGitHubId(payload.installation.id);
    await deleteInstallationByGitHubId(payload.installation.id, installation?.organization_id);
    console.log(`[GitHub Webhook] Deleted installation ${payload.installation.id}`);
  }
}
