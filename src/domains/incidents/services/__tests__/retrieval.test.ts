/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert";
import { generateEmbedding } from "../embeddings";
import { hybridSearchIncidents } from "../retrieval";
import { db } from "@/lib/db";

test("generateEmbedding returns 1536-dimensional array", async () => {
  const embedding = await generateEmbedding("test query");
  assert.ok(Array.isArray(embedding));
  assert.strictEqual(embedding.length, 1536);
  // Verify it contains numbers
  assert.strictEqual(typeof embedding[0], "number");
});

test("hybridSearchIncidents blends and ranks results using RRF", async () => {
  const originalExecute = db.execute;

  // Mock DB execute
  let executeCallCount = 0;
  db.execute = function(_queryObj: any) {
    executeCallCount++;
    if (executeCallCount === 1) {
      // First call is Keyword FTS search
      // Return 2 rows: A and B
      return [
        {
          id: "incident-A",
          title: "Payment gateway timeout",
          description: "Stripe payments timing out",
          severity: "high",
          status: "resolved",
          created_at: new Date(),
          rank: 0.9,
        },
        {
          id: "incident-B",
          title: "Stripe webhooks failing",
          description: "Stripe events are not processing",
          severity: "medium",
          status: "monitoring",
          created_at: new Date(),
          rank: 0.5,
        },
      ] as any;
    } else {
      // Second call is Vector similarity search
      // Return 2 rows: B and C
      return [
        {
          id: "incident-B",
          title: "Stripe webhooks failing",
          description: "Stripe events are not processing",
          severity: "medium",
          status: "monitoring",
          created_at: new Date(),
          similarity: 0.95,
        },
        {
          id: "incident-C",
          title: "Database CPU spike",
          description: "Incident C description",
          severity: "critical",
          status: "investigating",
          created_at: new Date(),
          similarity: 0.8,
        },
      ] as any;
    }
  } as any;

  try {
    const results = await hybridSearchIncidents("org-123", "stripe failure", 3);
    assert.strictEqual(results.length, 3);

    // Verify ordering by fused RRF score:
    // Incident B was in both: rank 2 (keyword) and rank 1 (vector).
    // RRF Score for B = 1/(60+2) + 1/(60+1) = 0.016129 + 0.016393 = 0.0325
    // Incident A was only in keyword: rank 1.
    // RRF Score for A = 1/(60+1) = 0.016393
    // Incident C was only in vector: rank 2.
    // RRF Score for C = 1/(60+2) = 0.016129
    // Expected order: B (highest), A (middle), C (lowest)
    assert.strictEqual(results[0]!.id, "incident-B");
    assert.strictEqual(results[1]!.id, "incident-A");
    assert.strictEqual(results[2]!.id, "incident-C");

    assert.ok(results[0]!.score > results[1]!.score);
    assert.ok(results[1]!.score > results[2]!.score);
  } finally {
    db.execute = originalExecute;
  }
});
