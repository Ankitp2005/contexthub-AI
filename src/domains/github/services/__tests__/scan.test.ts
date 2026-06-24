/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert";
import { POST } from "../../../../app/api/repositories/scan/route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

// Set test mode env
(process.env as any).NODE_ENV = "test";

test("POST /api/repositories/scan - triggers scan for unlocked repositories", async () => {
  const originalSelect = db.select;
  const originalUpdate = db.update;
  const originalSend = inngest.send;

  let updateCalledWith: any = null;
  const inngestSentEvents: any[] = [];

  // Mock DB select to return one unlocked repository
  db.select = function() {
    return {
      from: function() {
        return {
          where: async function() {
            return [
              {
                id: "repo-123",
                organization_id: "user-123",
                github_repo_id: 9999,
                name: "test-repo",
                full_name: "test-owner/test-repo",
                default_branch: "main",
                visibility: "public",
                syncing_at: null,
                last_scanned_at: null,
              },
            ];
          },
        };
      },
    } as any;
  };

  // Mock DB update
  db.update = function() {
    return {
      set: function(data: any) {
        updateCalledWith = data;
        return {
          where: function() {
            return {
              returning: async function() {
                return [
                  {
                    id: "repo-123",
                    syncing_at: data.syncing_at,
                  },
                ];
              },
            };
          },
        };
      },
    } as any;
  };

  // Mock Inngest send
  inngest.send = async (event: any) => {
    inngestSentEvents.push(event);
    return { ids: ["event-123"] };
  };

  try {
    const req = new NextRequest("http://localhost/api/repositories/scan", {
      method: "POST",
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.deepStrictEqual(json.scanned, ["test-owner/test-repo"]);
    assert.deepStrictEqual(json.skipped, []);

    // Verify DB update lock was acquired
    assert.ok(updateCalledWith);
    assert.ok(updateCalledWith.syncing_at instanceof Date);

    // Verify Inngest event was dispatched
    assert.strictEqual(inngestSentEvents.length, 1);
    assert.strictEqual(inngestSentEvents[0].name, "repository.scan");
    assert.strictEqual(inngestSentEvents[0].data.repositoryId, "repo-123");
    assert.strictEqual(inngestSentEvents[0].data.organizationId, "user-123");
  } finally {
    db.select = originalSelect;
    db.update = originalUpdate;
    inngest.send = originalSend;
  }
});

test("POST /api/repositories/scan - skips repositories in scan cooldown", async () => {
  const originalSelect = db.select;
  const originalUpdate = db.update;
  const originalSend = inngest.send;

  let updateCalled = false;
  const inngestSentEvents: any[] = [];

  // Mock DB select to return a repository currently syncing (lock acquired 1 min ago)
  db.select = function() {
    return {
      from: function() {
        return {
          where: async function() {
            return [
              {
                id: "repo-locked",
                organization_id: "user-123",
                github_repo_id: 8888,
                name: "locked-repo",
                full_name: "test-owner/locked-repo",
                default_branch: "main",
                visibility: "public",
                syncing_at: new Date(Date.now() - 60 * 1000), // 1 minute ago (cooldown active)
                last_scanned_at: null,
              },
            ];
          },
        };
      },
    } as any;
  };

  db.update = function() {
    updateCalled = true;
    return {} as any;
  };

  inngest.send = async (event: any) => {
    inngestSentEvents.push(event);
    return { ids: [] };
  };

  try {
    const req = new NextRequest("http://localhost/api/repositories/scan", {
      method: "POST",
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.deepStrictEqual(json.scanned, []);
    assert.deepStrictEqual(json.skipped, ["test-owner/locked-repo"]);

    // Verify no DB lock update or Inngest event was triggered
    assert.strictEqual(updateCalled, false);
    assert.strictEqual(inngestSentEvents.length, 0);
  } finally {
    db.select = originalSelect;
    db.update = originalUpdate;
    inngest.send = originalSend;
  }
});
