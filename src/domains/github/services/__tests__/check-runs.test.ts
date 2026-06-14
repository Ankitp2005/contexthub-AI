import { test, mock } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  getCheckConclusionForLevel,
  createCheckRun,
} from "../check-runs";

// Set environment variables required for JWT generation
process.env.GITHUB_APP_ID = "123456";
process.env.GITHUB_APP_PRIVATE_KEY = "dummy-private-key";

// Mock crypto.createSign to bypass RSA private key requirements in tests
mock.method(crypto, "createSign", () => {
  return {
    update: function() { return this; },
    sign: function() { return "mock-signature"; }
  } as unknown as crypto.Sign;
});

test("getCheckConclusionForLevel maps levels correctly", () => {
  assert.strictEqual(getCheckConclusionForLevel("CRITICAL"), "failure");
  assert.strictEqual(getCheckConclusionForLevel("HIGH"), "neutral");
  assert.strictEqual(getCheckConclusionForLevel("MEDIUM"), "success");
  assert.strictEqual(getCheckConclusionForLevel("LOW"), "success");
});

test("createCheckRun calls fetch and returns checks metadata", async () => {
  const mockTokenResponse = {
    token: "mock-token-check",
    expires_at: "2026-06-06T00:00:00Z",
  };

  const mockCheckRunResponse = {
    id: 987654,
    html_url: "https://github.com/test-owner/test-repo/runs/987654",
  };

  const originalFetch = globalThis.fetch;
  const fetchCalls: Array<{ url: string; options: RequestInit }> = [];

  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
    const urlStr = String(url);
    const opts = options || {};
    fetchCalls.push({ url: urlStr, options: opts });

    if (urlStr.includes("/access_tokens")) {
      return {
        ok: true,
        status: 201,
        statusText: "Created",
        json: async () => mockTokenResponse,
        text: async () => JSON.stringify(mockTokenResponse),
      } as unknown as Response;
    }

    if (urlStr.includes("/check-runs")) {
      return {
        ok: true,
        status: 201,
        statusText: "Created",
        json: async () => mockCheckRunResponse,
        text: async () => JSON.stringify(mockCheckRunResponse),
      } as unknown as Response;
    }

    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Not Found",
    } as unknown as Response;
  };

  try {
    const result = await createCheckRun({
      installationId: 888,
      owner: "test-owner",
      repo: "test-repo",
      headSha: "abcdef1234567890",
      riskScore: 9,
      riskLevel: "CRITICAL",
      summary: "Critically high risk.",
    });

    assert.strictEqual(fetchCalls.length, 2);

    const tokenCall = fetchCalls[0]!;
    assert.strictEqual(tokenCall.url, "https://api.github.com/app/installations/888/access_tokens");

    const checkCall = fetchCalls[1]!;
    assert.strictEqual(checkCall.url, "https://api.github.com/repos/test-owner/test-repo/check-runs");
    assert.strictEqual(checkCall.options.method, "POST");

    const headers = checkCall.options.headers as Record<string, string>;
    assert.strictEqual(headers["Authorization"], "token mock-token-check");

    const body = JSON.parse(checkCall.options.body as string);
    assert.strictEqual(body.name, "ContextHub Risk Assessment");
    assert.strictEqual(body.head_sha, "abcdef1234567890");
    assert.strictEqual(body.conclusion, "failure");
    assert.strictEqual(body.output.title, "Risk Score: 9/10 — CRITICAL");
    assert.strictEqual(body.output.text, "Critically high risk.");

    assert.strictEqual(result.id, 987654);
    assert.strictEqual(result.htmlUrl, mockCheckRunResponse.html_url);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
