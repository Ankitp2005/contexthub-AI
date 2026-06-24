// src/domains/ownership/services/__tests__/confidence.test.ts
// Unit tests for the Ownership Confidence Engine (pure function — no DB, no network)

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeOwnershipScores,
  getPrimaryOwner,
  type CommitActivityRow,
} from "../confidence";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function row(
  author_login: string,
  file_path: string,
  commit_count: number,
  additions = 0,
  deletions = 0
): CommitActivityRow {
  return { author_login, file_path, commit_count, additions, deletions };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("computeOwnershipScores", () => {
  it("returns empty array when no rows provided", () => {
    const result = computeOwnershipScores([]);
    assert.deepStrictEqual(result, []);
  });

  it("sole author on a file gets 100% confidence", () => {
    const rows = [row("alice", "src/foo.ts", 10, 200, 50)];
    const scores = computeOwnershipScores(rows, 3);
    assert.equal(scores.length, 1);
    assert.equal(scores[0]!.ownerLogin, "alice");
    assert.equal(scores[0]!.confidenceScore, 100);
    assert.equal(scores[0]!.commitCount, 10);
    assert.equal(scores[0]!.totalCommits, 10);
  });

  it("splits confidence proportionally between two authors (commit-only)", () => {
    // alice: 6 commits, bob: 4 commits → alice 60%, bob 40% (commit share)
    // No lines → line share defaults to commit share
    const rows = [
      row("alice", "src/bar.ts", 6),
      row("bob",   "src/bar.ts", 4),
    ];
    const scores = computeOwnershipScores(rows, 3);
    const alice = scores.find((s) => s.ownerLogin === "alice");
    const bob   = scores.find((s) => s.ownerLogin === "bob");

    assert.ok(alice, "alice should have a score");
    assert.ok(bob,   "bob should have a score");
    assert.equal(alice!.confidenceScore, 60);
    assert.equal(bob!.confidenceScore, 40);
    assert.equal(alice!.totalCommits, 10);
  });

  it("applies 70/30 weighting between commit share and line share", () => {
    // alice: 8/10 commits (80%), 20/100 lines (20%)
    // → 0.7 * 80 + 0.3 * 20 = 56 + 6 = 62.00
    const rows = [
      row("alice", "src/baz.ts",  8, 20, 0),
      row("bob",   "src/baz.ts",  2, 80, 0),
    ];
    const scores = computeOwnershipScores(rows, 3);
    const alice = scores.find((s) => s.ownerLogin === "alice");
    assert.ok(alice);
    assert.equal(alice!.confidenceScore, 62);
  });

  it("returns at most topN candidates per file", () => {
    const rows = [
      row("alice",  "src/multi.ts", 5),
      row("bob",    "src/multi.ts", 4),
      row("carol",  "src/multi.ts", 3),
      row("dave",   "src/multi.ts", 2),
    ];
    const scores = computeOwnershipScores(rows, 2);
    const fileCandidates = scores.filter((s) => s.filePath === "src/multi.ts");
    assert.equal(fileCandidates.length, 2);
    // First candidate should be alice (highest commits)
    assert.equal(fileCandidates[0]!.ownerLogin, "alice");
  });

  it("handles multiple files independently", () => {
    const rows = [
      row("alice", "src/a.ts", 10),
      row("bob",   "src/b.ts", 10),
    ];
    const scores = computeOwnershipScores(rows, 3);
    const fileA = scores.filter((s) => s.filePath === "src/a.ts");
    const fileB = scores.filter((s) => s.filePath === "src/b.ts");
    assert.equal(fileA.length, 1);
    assert.equal(fileB.length, 1);
    assert.equal(fileA[0]!.ownerLogin, "alice");
    assert.equal(fileB[0]!.ownerLogin, "bob");
  });

  it("clamps confidence to 0 – 100 range", () => {
    // Edge case: verify no score exceeds 100 with large commits
    const rows = [row("alice", "src/edge.ts", 999_999, 999_999, 0)];
    const scores = computeOwnershipScores(rows, 3);
    assert.ok(scores[0]!.confidenceScore <= 100);
    assert.ok(scores[0]!.confidenceScore >= 0);
  });
});

describe("getPrimaryOwner", () => {
  it("returns null when no scores match filePath", () => {
    const result = getPrimaryOwner([], "src/missing.ts");
    assert.equal(result, null);
  });

  it("returns the highest-confidence owner for the given filePath", () => {
    const scores = [
      { filePath: "src/foo.ts", ownerLogin: "alice", confidenceScore: 70, commitCount: 7, totalCommits: 10 },
      { filePath: "src/foo.ts", ownerLogin: "bob",   confidenceScore: 30, commitCount: 3, totalCommits: 10 },
      { filePath: "src/bar.ts", ownerLogin: "carol", confidenceScore: 90, commitCount: 9, totalCommits: 10 },
    ];
    const owner = getPrimaryOwner(scores, "src/foo.ts");
    assert.ok(owner);
    assert.equal(owner!.ownerLogin, "alice");
    assert.equal(owner!.confidenceScore, 70);
  });
});
