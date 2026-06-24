/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert";
import { POST } from "../../../../app/api/mcp/route";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

process.env.MCP_API_KEY = "mock-api-key";

test("POST /api/mcp standard JSON-RPC 2.0 list resources", async () => {
  const req = new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      Authorization: "Bearer mock-api-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "resources/list",
      id: 1,
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.jsonrpc, "2.0");
  assert.strictEqual(json.id, 1);
  assert.ok(json.result.resources);
  assert.strictEqual(json.result.resources[0].uri, "context://codebase/{repo}");
});

test("POST /api/mcp standard JSON-RPC 2.0 read codebase resource", async () => {
  const originalSelect = db.select;

  let selectCallCount = 0;
  db.select = function() {
    selectCallCount++;
    return {
      from: function() {
        return {
          where: function() {
            if (selectCallCount === 1) {
              return {
                limit: async function() {
                  return [{ id: "repo-123", full_name: "test-owner/test-repo", name: "test-repo" }];
                }
              };
            } else {
              return Promise.resolve([{
                id: "rule-123",
                repository_id: "repo-123",
                path_pattern: "src/payments/*",
                owner_type: "TEAM",
                owner_name: "Payments",
                confidence: "1.0",
              }]);
            }
          }
        };
      }
    } as any;
  };

  try {
    const req = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer mock-api-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "resources/read",
        params: {
          uri: "context://codebase/test-repo",
        },
        id: 2,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.id, 2);
    assert.ok(json.result.contents);
    const textObj = JSON.parse(json.result.contents[0].text);
    assert.strictEqual(textObj.repo, "test-owner/test-repo");
    assert.strictEqual(textObj.teams[0], "Payments");
  } finally {
    db.select = originalSelect;
  }
});

test("POST /api/mcp custom simplified resource query", async () => {
  const originalSelect = db.select;

  let selectCallCount = 0;
  db.select = function() {
    selectCallCount++;
    return {
      from: function() {
        return {
          where: function() {
            if (selectCallCount === 1) {
              return {
                limit: async function() {
                  return [{ id: "repo-123", full_name: "test-owner/test-repo", name: "test-repo" }];
                }
              };
            } else {
              return Promise.resolve([{
                id: "rule-123",
                repository_id: "repo-123",
                path_pattern: "src/payments/*",
                owner_type: "TEAM",
                owner_name: "Payments",
                confidence: "1.0",
              }]);
            }
          }
        };
      }
    } as any;
  };

  try {
    const req = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer mock-api-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resource: "context://codebase/test-repo",
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.repo, "test-owner/test-repo");
    assert.strictEqual(json.teams[0], "Payments");
  } finally {
    db.select = originalSelect;
  }
});

test("POST /api/mcp returns 401 Unauthorized for invalid token", async () => {
  const originalSelect = db.select;

  // Mock db.select().from(organizations).where(...).limit(1) to return empty
  db.select = function() {
    return {
      from: function() {
        return {
          where: function() {
            return {
              limit: async function() {
                return []; // organization not found
              }
            };
          }
        };
      }
    } as any;
  };

  try {
    const req = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "resources/list",
        id: 1,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.error, "Unauthorized");
  } finally {
    db.select = originalSelect;
  }
});

test("POST /api/mcp returns 403 Forbidden when repo is not owned by tenant (tools/call)", async () => {
  const originalSelect = db.select;

  // Mock db.select().from(repositories).where(...).limit(1) to return empty (not owned)
  db.select = function() {
    return {
      from: function() {
        return {
          where: function() {
            return {
              limit: async function() {
                return []; // repo not found or not owned
              }
            };
          }
        };
      }
    } as any;
  };

  try {
    const req = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer mock-api-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "score_change",
          arguments: {
            repositoryId: "unowned-repo-123",
            files: ["src/payments/handler.ts"],
            diff: "@@ -1,1 +1,2 @@\n-const a = 1;\n+const a = 2;\n+const b = 3;\n",
          },
        },
        id: 3,
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.id, 3);
    assert.strictEqual(json.error.code, 403);
    assert.strictEqual(json.error.message, "Forbidden: Repository does not belong to your organization");
  } finally {
    db.select = originalSelect;
  }
});

test("POST /api/mcp custom simplified tool call returns 403 when repo is not owned by tenant", async () => {
  const originalSelect = db.select;

  // Mock db.select().from(repositories).where(...).limit(1) to return empty
  db.select = function() {
    return {
      from: function() {
        return {
          where: function() {
            return {
              limit: async function() {
                return []; // repo not found/owned
              }
            };
          }
        };
      }
    } as any;
  };

  try {
    const req = new NextRequest("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        Authorization: "Bearer mock-api-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool: "score_change",
        input: {
          repositoryId: "unowned-repo-123",
          files: ["src/payments/handler.ts"],
          diff: "@@ -1,1 +1,2 @@\n-const a = 1;\n+const a = 2;\n+const b = 3;\n",
        },
      }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.error, "Forbidden: Repository does not belong to your organization");
  } finally {
    db.select = originalSelect;
  }
});

test("POST /api/mcp standard JSON-RPC 2.0 list prompts", async () => {
  const req = new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      Authorization: "Bearer mock-api-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "prompts/list",
      id: 10,
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.jsonrpc, "2.0");
  assert.strictEqual(json.id, 10);
  assert.ok(json.result.prompts);
  assert.strictEqual(json.result.prompts[0].name, "safe_agent_preamble");
});

test("POST /api/mcp standard JSON-RPC 2.0 get prompt", async () => {
  const req = new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      Authorization: "Bearer mock-api-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "prompts/get",
      params: {
        name: "safe_agent_preamble",
      },
      id: 11,
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.id, 11);
  assert.ok(json.result.messages);
  assert.strictEqual(json.result.messages[0].role, "user");
  assert.ok(json.result.messages[0].content.text.includes("get_ownership"));
});

test("POST /api/mcp custom simplified prompt query", async () => {
  const req = new NextRequest("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      Authorization: "Bearer mock-api-key",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "safe_agent_preamble",
    }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.name, "safe_agent_preamble");
  assert.strictEqual(json.messages[0].role, "user");
  assert.ok(json.messages[0].content.text.includes("get_ownership"));
});


