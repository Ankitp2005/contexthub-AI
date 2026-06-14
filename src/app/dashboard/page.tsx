import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { listRepositoriesByOrganization } from "@/domains/github/repositories";
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

  const githubAppSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
  const installUrl = `https://github.com/apps/${githubAppSlug}/installations/new`;

  // Fetch user profile info, repositories, pull requests, constraints, and incidents
  const [user, repos, prs, constraints, incidentsList] = await Promise.all([
    currentUser(),
    listRepositoriesByOrganization(userId),
    listPullRequestsWithAssessmentsForOrganization(userId),
    getConstraintsForOrganization(userId),
    getIncidentsForOrganization(userId),
  ]);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "admin@acme.io";
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName.slice(0, 2).toUpperCase()
      : "U";

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#e8e4dc]">
      <header className="flex items-center justify-between border-b border-[#1e1e1e] bg-[#0f0f0f] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#e8c547] text-black font-bold text-sm">
            C
          </div>
          <h1 className="text-lg font-bold text-[#e8e4dc] font-sans tracking-wide">
            ContextHub AI
          </h1>
        </div>
        <UserButton />
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <DashboardClient
          repos={repos}
          prs={prs}
          constraints={constraints}
          incidents={incidentsList}
          installUrl={installUrl}
          userEmail={userEmail}
          userInitials={userInitials}
        />
      </main>
    </div>
  );
}

