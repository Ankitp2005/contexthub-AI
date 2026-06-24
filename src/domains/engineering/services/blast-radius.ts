// src/domains/engineering/services/blast-radius.ts
//
// Blast Radius Engine
//
// Given a set of changed files/packages in a repository, computes the
// transitive set of repositories that could be affected.
//
// Algorithm:
//   1. Build an in-memory adjacency map from the flat dependency_graph rows:
//      packageName → Set<sourceRepositoryId>  (who depends on this package?)
//   2. For each changed file, extract the "package context":
//      - Use the package name registered for the repository (source repo name)
//      - Walk the graph BFS/DFS to find all upstream dependents
//   3. Return scored results: direct dependents score higher than transitive ones.
//
// Security: This service only reads pre-fetched DB rows.
// It never calls external APIs or touches raw PR data.

export interface DependencyRow {
  source_repository_id: string;
  package_name: string;
  dependent_repository_id: string | null;
  ecosystem: string;
}

export interface RepositoryInfo {
  id: string;
  name: string;
  organization_id: string;
}

export interface BlastRadiusEntry {
  repositoryId: string;
  repositoryName: string;
  /** "direct" = immediate dependent; "transitive" = downstream */
  relationship: "direct" | "transitive";
  /** How many hops from the changed repository (1 = direct) */
  depth: number;
  /** The package name that creates the link */
  viaPackage: string;
}

export interface BlastRadiusResult {
  changedRepositoryId: string;
  changedPackageName: string | null;
  affectedRepositories: BlastRadiusEntry[];
  /** true if any direct dependents found */
  hasImpact: boolean;
  totalAffected: number;
}

// ---------------------------------------------------------------------------
// Core engine — pure function, no I/O
// ---------------------------------------------------------------------------

/**
 * Builds an adjacency map: package_name → Set<source_repository_id>
 * (i.e., who depends on this package?).
 */
export function buildAdjacencyMap(
  rows: DependencyRow[]
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = row.package_name.toLowerCase();
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(row.source_repository_id);
  }
  return map;
}

/**
 * Resolves the package name published by a repository.
 * Looks for a dependency_graph row where `dependent_repository_id` matches
 * the given repositoryId — that tells us what package name this repo is
 * known as to dependents.
 */
export function resolveRepositoryPackageName(
  rows: DependencyRow[],
  repositoryId: string
): string | null {
  const match = rows.find((r) => r.dependent_repository_id === repositoryId);
  return match?.package_name ?? null;
}

/**
 * Computes the full blast radius for a changed repository.
 *
 * @param changedRepositoryId  The repo that was modified
 * @param allRows              All dependency_graph rows for the organisation
 * @param repoInfoMap          Map of repositoryId → { name } for display
 * @param maxDepth             Maximum traversal depth (default 5)
 */
export function computeBlastRadius(
  changedRepositoryId: string,
  allRows: DependencyRow[],
  repoInfoMap: Map<string, RepositoryInfo>,
  maxDepth = 5
): BlastRadiusResult {
  const packageName = resolveRepositoryPackageName(allRows, changedRepositoryId);
  const adjacency = buildAdjacencyMap(allRows);

  if (!packageName) {
    // Repository not known as a published package — no downstream dependents
    return {
      changedRepositoryId,
      changedPackageName: null,
      affectedRepositories: [],
      hasImpact: false,
      totalAffected: 0,
    };
  }

  // BFS traversal
  const affected: BlastRadiusEntry[] = [];
  const visited = new Set<string>([changedRepositoryId]);

  interface QueueItem {
    repoId: string;
    depth: number;
    viaPackage: string;
    relationship: "direct" | "transitive";
  }

  const queue: QueueItem[] = [];

  // Seed: direct dependents of the changed package
  const directDeps = adjacency.get(packageName.toLowerCase()) ?? new Set();
  for (const depRepoId of directDeps) {
    if (!visited.has(depRepoId)) {
      visited.add(depRepoId);
      queue.push({ repoId: depRepoId, depth: 1, viaPackage: packageName, relationship: "direct" });
    }
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    const repoInfo = repoInfoMap.get(item.repoId);

    affected.push({
      repositoryId: item.repoId,
      repositoryName: repoInfo?.name ?? item.repoId,
      relationship: item.relationship,
      depth: item.depth,
      viaPackage: item.viaPackage,
    });

    if (item.depth >= maxDepth) continue;

    // Find what package name this dependent repo publishes
    const transitivePackage = resolveRepositoryPackageName(allRows, item.repoId);
    if (!transitivePackage) continue;

    const nextDeps = adjacency.get(transitivePackage.toLowerCase()) ?? new Set();
    for (const nextId of nextDeps) {
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push({
          repoId: nextId,
          depth: item.depth + 1,
          viaPackage: transitivePackage,
          relationship: "transitive",
        });
      }
    }
  }

  // Sort: direct first, then by depth ascending
  affected.sort((a, b) =>
    a.relationship !== b.relationship
      ? a.relationship === "direct" ? -1 : 1
      : a.depth - b.depth
  );

  return {
    changedRepositoryId,
    changedPackageName: packageName,
    affectedRepositories: affected,
    hasImpact: affected.length > 0,
    totalAffected: affected.length,
  };
}
