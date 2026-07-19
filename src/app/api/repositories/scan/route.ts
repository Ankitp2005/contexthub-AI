import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listRepositoriesByOrganization, updateRepositorySyncState } from "@/domains/github/repositories";
import { inngest } from "@/lib/inngest/client";
import { performDirectSync } from "@/lib/inngest/functions";

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  if ((process.env.NODE_ENV as string) === "test" || (process.env.NODE_ENV as string) === "testing") {
    userId = request.headers.get("x-mock-user-id") || "user-123";
  } else {
    const session = await auth();
    userId = session.userId;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await listRepositoriesByOrganization(userId);
    if (repos.length === 0) {
      return NextResponse.json({ success: true, message: "No repositories found to scan." });
    }

    const scanTriggers: string[] = [];
    const skippedRepos: string[] = [];
    const cooldownPeriodMs = 5 * 60 * 1000; // 5 minutes

    for (const repo of repos) {
      const isSyncing =
        repo.syncing_at &&
        Date.now() - new Date(repo.syncing_at).getTime() < cooldownPeriodMs;

      if (isSyncing) {
        skippedRepos.push(repo.full_name);
      } else {
        // Set syncing lock state
        await updateRepositorySyncState(repo.id, new Date());
        
        try {
          // Attempt to dispatch via Inngest background job
          await inngest.send({
            name: "repository.scan",
            data: {
              repositoryId: repo.id,
              organizationId: userId,
            },
          });
          console.log(`[Scan API] Dispatched scan event to Inngest for repo ${repo.full_name}`);
        } catch (inngestError) {
          console.warn(
            `[Scan API] Inngest dispatch failed for ${repo.full_name}, falling back to direct background sync:`,
            inngestError
          );
          // Fallback to inline background processing so the API call doesn't throw a 500 error
          void performDirectSync(repo.id, userId).catch((err) => {
            console.error(`[Scan API] Direct background sync failed for ${repo.full_name}:`, err);
          });
        }
        
        scanTriggers.push(repo.full_name);
      }
    }

    return NextResponse.json({
      success: true,
      scanned: scanTriggers,
      skipped: skippedRepos,
    });
  } catch (error) {
    console.error("[Scan API] Error triggering scan:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
