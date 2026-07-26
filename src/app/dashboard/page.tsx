import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  listRepositoriesByOrganization,
  findInstallationByOrganizationId,
} from "@/domains/github/repositories";
import { listPullRequestsWithAssessmentsForOrganization } from "@/domains/github/repositories/pull-requests";
import { getConstraintsForOrganization } from "@/domains/constraints/repositories";
import { getIncidentsForOrganization } from "@/domains/incidents/repositories";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | ContextHub AI",
  description: "View connected repositories, AI agent pull request risk assessments, and trends.",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [user, repos, prs, constraints, incidentsList, installation] = await Promise.all([
    currentUser(),
    listRepositoriesByOrganization(userId),
    listPullRequestsWithAssessmentsForOrganization(userId),
    getConstraintsForOrganization(userId),
    getIncidentsForOrganization(userId),
    findInstallationByOrganizationId(userId),
  ]);

  const githubAppSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
  const installUrl = installation
    ? `https://github.com/settings/installations/${installation.github_installation_id}`
    : `https://github.com/apps/${githubAppSlug}/installations/new`;

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "admin@acme.io";
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName.slice(0, 2).toUpperCase()
      : "U";

  return (
    <DashboardClient
      repos={repos}
      prs={prs}
      constraints={constraints}
      incidents={incidentsList}
      installUrl={installUrl}
      userEmail={userEmail}
      userInitials={userInitials}
    />
  );
}


