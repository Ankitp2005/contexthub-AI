// src/domains/engineering/repositories/index.ts
//
// Database access layer for the dependency_graph table.
// All queries are organisation-scoped to preserve multi-tenancy.

import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dependency_graph, repositories } from "@/lib/db/schema";
import type { DependencyEdge } from "@/domains/github/services/dependencies";

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

/**
 * Replaces all dependency edges for a repository, then inserts the fresh batch.
 * Runs inside a transaction for atomicity.
 */
export async function syncDependencyEdges(
  organizationId: string,
  sourceRepositoryId: string,
  edges: DependencyEdge[]
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(dependency_graph)
      .where(
        and(
          eq(dependency_graph.organization_id, organizationId),
          eq(dependency_graph.source_repository_id, sourceRepositoryId)
        )
      );

    if (edges.length === 0) return;

    // Resolve which packages are also tracked repositories in this org
    const orgRepos = await tx
      .select({ id: repositories.id, name: repositories.name })
      .from(repositories)
      .where(eq(repositories.organization_id, organizationId));

    const repoNameMap = new Map(orgRepos.map((r) => [r.name.toLowerCase(), r.id]));

    const rows = edges.map((e) => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      source_repository_id: sourceRepositoryId,
      package_name: e.packageName,
      package_version: e.packageVersion,
      ecosystem: e.ecosystem,
      // Link to internal repo if package name matches a known repo name
      dependent_repository_id: repoNameMap.get(e.packageName.toLowerCase()) ?? null,
    }));

    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await tx.insert(dependency_graph).values(rows.slice(i, i + CHUNK));
    }
  });
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Returns all dependency edges for a source repository.
 */
export async function getDependenciesForRepository(
  organizationId: string,
  sourceRepositoryId: string
) {
  return db
    .select()
    .from(dependency_graph)
    .where(
      and(
        eq(dependency_graph.organization_id, organizationId),
        eq(dependency_graph.source_repository_id, sourceRepositoryId)
      )
    );
}

/**
 * Returns all repositories that directly depend on a given package name.
 * Used as the first step in blast radius computation.
 */
export async function getDirectDependents(
  organizationId: string,
  packageName: string
) {
  return db
    .select()
    .from(dependency_graph)
    .where(
      and(
        eq(dependency_graph.organization_id, organizationId),
        sql`lower(${dependency_graph.package_name}) = lower(${packageName})`
      )
    );
}

/**
 * Returns all dependency_graph rows for an organisation.
 * Used by the blast-radius engine to build the full in-memory adjacency map.
 */
export async function getAllDependencyEdges(organizationId: string) {
  return db
    .select()
    .from(dependency_graph)
    .where(eq(dependency_graph.organization_id, organizationId));
}
