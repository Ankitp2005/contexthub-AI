import { test, mock } from "node:test";
import assert from "node:assert";
import { getCodebaseContext, getIncidentContext } from "../resources";
import { db } from "@/lib/db";

test("getCodebaseContext returns codebase context when repo is found", async () => {
  const originalSelect = db.select;

  // Mock db.select().from().where().limit()
  const mockRepo = {
    id: "repo-123",
    full_name: "test-owner/test-repo",
    name: "test-repo",
  };
  const mockRule = {
    id: "rule-123",
    repository_id: "repo-123",
    path_pattern: "src/payments/*",
    owner_type: "TEAM",
    owner_name: "Payments",
    confidence: "1.0",
  };

  let selectCallCount = 0;

  db.select = function() {
    selectCallCount++;
    return {
      from: function() {
        return {
          where: function() {
            if (selectCallCount === 1) {
              // first call is repositories query
              return {
                limit: async function() {
                  return [mockRepo];
                }
              };
            } else {
              // second call is ownership rules query
              return Promise.resolve([mockRule]);
            }
          }
        };
      }
    } as any;
  };

  try {
    const context = await getCodebaseContext("org-123", "test-repo");

    assert.ok(context);
    assert.strictEqual(context.repo, "test-owner/test-repo");
    assert.strictEqual(context.teams.length, 1);
    assert.strictEqual(context.teams[0], "Payments");
    assert.strictEqual(context.ownership.length, 1);
    assert.strictEqual(context.ownership[0]!.pattern, "src/payments/*");
    assert.strictEqual(context.ownership[0]!.ownerName, "Payments");
    assert.ok(context.criticalSystems.includes("payments"));
    assert.strictEqual(context.architectureMetadata.style, "Modular Monolith");
  } finally {
    db.select = originalSelect;
  }
});

test("getCodebaseContext returns null when repo is not found", async () => {
  const originalSelect = db.select;

  db.select = function() {
    return {
      from: function() {
        return {
          where: function() {
            return {
              limit: async function() {
                return [];
              }
            };
          }
        };
      }
    } as any;
  };

  try {
    const context = await getCodebaseContext("org-123", "non-existent");
    assert.strictEqual(context, null);
  } finally {
    db.select = originalSelect;
  }
});

test("getIncidentContext returns incidents mapped to service", async () => {
  const originalSelect = db.select;

  const mockIncident = {
    id: "inc-123",
    title: "Database Outage",
    severity: "HIGH",
    description: "Database primary replica connection failure",
    status: "RESOLVED",
    created_at: new Date("2026-06-10T12:00:00Z"),
  };

  db.select = function() {
    return {
      from: function() {
        return {
          innerJoin: function() {
            return {
              where: async function() {
                return [mockIncident];
              }
            };
          }
        };
      }
    } as any;
  };

  try {
    const context = await getIncidentContext("org-123", "database");

    assert.strictEqual(context.serviceName, "database");
    assert.strictEqual(context.incidentCount, 1);
    assert.strictEqual(context.recentIncidents.length, 1);
    assert.strictEqual(context.recentIncidents[0]!.title, "Database Outage");
    assert.strictEqual(context.recentIncidents[0]!.severity, "HIGH");
    assert.strictEqual(context.recentIncidents[0]!.status, "RESOLVED");
    assert.strictEqual(context.rootCauses.length, 1);
    assert.strictEqual(context.rootCauses[0], "Database primary replica connection failure");
  } finally {
    db.select = originalSelect;
  }
});
