// src/domains/mcp/services/blast-radius.ts
//
// MCP service layer for the get_blast_radius tool.
//
// Orchestrates:
//   1. Fetch all dependency_graph rows for the organisation (one DB round-trip)
//   2. Build a repo-info lookup map
//   3. Delegate to the pure computeBlastRadius engine
//
// Security: Only reads pre-computed DB rows. No GitHub API calls. No LLM.

import { z } from "zod";
import { db } from "@/lib/db";
import { repositories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAllDependencyEdges } from "@/domains/engineering/repositories";
import {
  computeBlastRadius,
  type BlastRadiusResult,
  type RepositoryInfo,
} from "@/domains/engineering/services/blast-radius";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

export const GetBlastRadiusInputSchema = z.object({
  repositoryId: z.string().min(1, "repositoryId is required"),
});

export type GetBlastRadiusInput = z.infer<typeof GetBlastRadiusInputSchema>;

// Re-export result type for MCP route
export type { BlastRadiusResult };

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------

export async function getBlastRadius(
  input: GetBlastRadiusInput,
  organizationId: string
): Promise<BlastRadiusResult> {
  const { repositoryId } = input;

  // 1. Fetch all dep edges for the org in a single query
  const allEdges = await getAllDependencyEdges(organizationId);

  // 2. Fetch all repositories for this org to build the name lookup map
  const orgRepos = await db
    .select()
    .from(repositories)
    .where(eq(repositories.organization_id, organizationId));

  const repoInfoMap = new Map<string, RepositoryInfo>(
    orgRepos.map((r) => [
      r.id,
      { id: r.id, name: r.name, organization_id: r.organization_id },
    ])
  );

  // 3. Run the pure blast radius engine
  return computeBlastRadius(repositoryId, allEdges, repoInfoMap, 5);
}
