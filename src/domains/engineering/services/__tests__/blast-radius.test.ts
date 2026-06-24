// src/domains/engineering/services/__tests__/blast-radius.test.ts
// Unit tests for the Blast Radius Engine — pure function, zero I/O

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdjacencyMap,
  computeBlastRadius,
  resolveRepositoryPackageName,
  type DependencyRow,
  type RepositoryInfo,
} from "../blast-radius";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function row(
  sourceRepoId: string,
  packageName: string,
  dependentRepoId?: string
): DependencyRow {
  return {
    source_repository_id: sourceRepoId,
    package_name: packageName,
    dependent_repository_id: dependentRepoId ?? null,
    ecosystem: "npm",
  };
}

function repoMap(repos: Array<{ id: string; name: string }>): Map<string, RepositoryInfo> {
  return new Map(
    repos.map((r) => [r.id, { id: r.id, name: r.name, organization_id: "org-1" }])
  );
}

// ---------------------------------------------------------------------------
// buildAdjacencyMap
// ---------------------------------------------------------------------------
describe("buildAdjacencyMap", () => {
  it("returns empty map for empty input", () => {
    const map = buildAdjacencyMap([]);
    assert.equal(map.size, 0);
  });

  it("maps package name to all repos that depend on it", () => {
    const rows = [
      row("repo-a", "shared-lib"),
      row("repo-b", "shared-lib"),
      row("repo-c", "other-pkg"),
    ];
    const map = buildAdjacencyMap(rows);
    assert.ok(map.has("shared-lib"));
    assert.equal(map.get("shared-lib")!.size, 2);
    assert.ok(map.get("shared-lib")!.has("repo-a"));
    assert.ok(map.get("shared-lib")!.has("repo-b"));
  });

  it("is case-insensitive on package names", () => {
    const rows = [row("repo-a", "MyLib"), row("repo-b", "mylib")];
    const map = buildAdjacencyMap(rows);
    assert.equal(map.get("mylib")!.size, 2);
  });
});

// ---------------------------------------------------------------------------
// resolveRepositoryPackageName
// ---------------------------------------------------------------------------
describe("resolveRepositoryPackageName", () => {
  it("returns null when repo is not a known package", () => {
    const result = resolveRepositoryPackageName([], "repo-x");
    assert.equal(result, null);
  });

  it("returns the package name for a repo that is a known dependency", () => {
    const rows = [
      row("repo-consumer", "my-lib", "repo-publisher"),
    ];
    const result = resolveRepositoryPackageName(rows, "repo-publisher");
    assert.equal(result, "my-lib");
  });
});

// ---------------------------------------------------------------------------
// computeBlastRadius
// ---------------------------------------------------------------------------
describe("computeBlastRadius", () => {
  it("returns hasImpact=false when repo is not a published package", () => {
    const result = computeBlastRadius("repo-x", [], new Map(), 5);
    assert.equal(result.hasImpact, false);
    assert.equal(result.changedPackageName, null);
    assert.equal(result.totalAffected, 0);
  });

  it("finds direct dependents correctly", () => {
    // repo-lib publishes "shared-lib"
    // repo-a and repo-b depend on "shared-lib"
    const rows = [
      row("repo-a", "shared-lib", "repo-lib"), // tells us repo-lib = "shared-lib"
      row("repo-b", "shared-lib", "repo-lib"),
      row("repo-a", "other-pkg"),
    ];
    const repos = repoMap([
      { id: "repo-lib", name: "shared-lib-repo" },
      { id: "repo-a", name: "service-a" },
      { id: "repo-b", name: "service-b" },
    ]);

    const result = computeBlastRadius("repo-lib", rows, repos, 5);

    assert.equal(result.hasImpact, true);
    assert.equal(result.changedPackageName, "shared-lib");
    assert.equal(result.totalAffected, 2);

    const direct = result.affectedRepositories.filter((r) => r.relationship === "direct");
    assert.equal(direct.length, 2);
    assert.ok(direct.some((r) => r.repositoryId === "repo-a"));
    assert.ok(direct.some((r) => r.repositoryId === "repo-b"));
    assert.equal(direct[0]!.depth, 1);
  });

  it("finds transitive dependents (depth 2)", () => {
    // repo-lib → repo-middleware → repo-api
    //   repo-lib publishes "core-lib"
    //   repo-middleware depends on "core-lib" (is also "middleware-pkg")
    //   repo-api depends on "middleware-pkg"
    const rows = [
      row("repo-middleware", "core-lib",       "repo-lib"),       // repo-lib = core-lib
      row("repo-api",        "middleware-pkg",  "repo-middleware"), // repo-middleware = middleware-pkg
    ];
    const repos = repoMap([
      { id: "repo-lib",        name: "core-lib-repo" },
      { id: "repo-middleware", name: "middleware-repo" },
      { id: "repo-api",        name: "api-repo" },
    ]);

    const result = computeBlastRadius("repo-lib", rows, repos, 5);

    assert.equal(result.hasImpact, true);
    assert.equal(result.totalAffected, 2);

    const mid  = result.affectedRepositories.find((r) => r.repositoryId === "repo-middleware")!;
    const api  = result.affectedRepositories.find((r) => r.repositoryId === "repo-api")!;

    assert.ok(mid,  "middleware should be affected");
    assert.ok(api,  "api should be affected");
    assert.equal(mid.relationship, "direct");
    assert.equal(mid.depth, 1);
    assert.equal(api.relationship, "transitive");
    assert.equal(api.depth, 2);
  });

  it("respects maxDepth and does not traverse beyond it", () => {
    // Chain: lib → A → B → C → D → E (5 hops)
    const rows = [
      row("a", "lib-pkg",  "repo-lib"),
      row("b", "pkg-a",    "a"),
      row("c", "pkg-b",    "b"),
      row("d", "pkg-c",    "c"),
      row("e", "pkg-d",    "d"),
    ];
    const repos = repoMap([
      { id: "repo-lib", name: "lib" },
      { id: "a", name: "a" }, { id: "b", name: "b" },
      { id: "c", name: "c" }, { id: "d", name: "d" },
      { id: "e", name: "e" },
    ]);

    const result = computeBlastRadius("repo-lib", rows, repos, 3);
    // maxDepth=3 → should find a (1), b (2), c (3) but not d (4) or e (5)
    assert.equal(result.totalAffected, 3);
    assert.ok(!result.affectedRepositories.some((r) => r.repositoryId === "d"));
    assert.ok(!result.affectedRepositories.some((r) => r.repositoryId === "e"));
  });

  it("does not revisit already-visited repos (no infinite cycles)", () => {
    // Circular: A → B → A (cycle)
    const rows = [
      row("b", "pkg-a", "a"),
      row("a", "pkg-b", "b"),
    ];
    const repos = repoMap([
      { id: "a", name: "repo-a" },
      { id: "b", name: "repo-b" },
    ]);

    // Should not throw or loop forever
    const result = computeBlastRadius("a", rows, repos, 10);
    assert.ok(result.totalAffected <= 1); // b is found, a is skipped (already visited)
  });
});
