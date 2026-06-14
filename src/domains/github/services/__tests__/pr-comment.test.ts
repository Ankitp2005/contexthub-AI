import { test, mock } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  getRecommendationForLevel,
  formatRiskComment,
  publishRiskComment,
} from "../pr-comment";
import type { RiskAssessmentResult } from "../../../risk/types";

// Set environment variables required for JWT generation
process.env.GITHUB_APP_ID = "123456";
process.env.GITHUB_APP_PRIVATE_KEY = "dummy-private-key";

// Mock crypto.createSign to bypass RSA private key requirements
mock.method(crypto, "createSign", () => {
  return {
    update: function() { return this; },
    sign: function() { return "mock-signature"; }
  } as unknown as crypto.Sign;
});

test("getRecommendationForLevel maps levels to recommendations correctly", () => {
  assert.strictEqual(
    getRecommendationForLevel("LOW"),
    "Low risk: no immediate action"
  );
  assert.strictEqual(
    getRecommendationForLevel("MEDIUM"),
    "Medium risk: consider additional review"
  );
  assert.strictEqual(
    getRecommendationForLevel("HIGH"),
    "High risk: require senior review"
  );
  assert.strictEqual(
    getRecommendationForLevel("CRITICAL"),
    "Critical: block merge, escalate"
  );
});

test("formatRiskComment formats comment with factors and no explanation", () => {
  const assessment: RiskAssessmentResult = {
    score: 8,
    level: "HIGH",
    factors: [
      { name: "OwnershipMismatch", weight: 3, reason: "Modified by non-owner" },
      { name: "CriticalService", weight: 4, reason: "Touches auth service" },
    ],
  };

  const comment = formatRiskComment(assessment);

  assert.match(comment, /## 🔍 ContextHub Risk Assessment/);
  assert.match(comment, /\*\*Risk Score:\*\* 8\/10 — \*\*HIGH\*\*/);
  assert.match(comment, /\| OwnershipMismatch \| \+3 \| Modified by non-owner \|/);
  assert.match(comment, /\| CriticalService \| \+4 \| Touches auth service \|/);
  assert.match(comment, /### Recommendation\nHigh risk: require senior review/);
  assert.doesNotMatch(comment, /### Explanation/);
});

test("formatRiskComment formats comment with factors and explanation", () => {
  const assessment: RiskAssessmentResult = {
    score: 5,
    level: "MEDIUM",
    factors: [
      { name: "RecentIncident", weight: 2, reason: "Recent incidents in database service" },
    ],
  };

  const explanation = "The change touches files associated with a database outage recently. Review is recommended.";
  const comment = formatRiskComment(assessment, explanation);

  assert.match(comment, /\*\*Risk Score:\*\* 5\/10 — \*\*MEDIUM\*\*/);
  assert.match(comment, /### Explanation\nThe change touches files/);
  assert.match(comment, /\| RecentIncident \| \+2 \| Recent incidents/);
  assert.match(comment, /### Recommendation\nMedium risk: consider additional review/);
});

test("formatRiskComment formats comment with no factors", () => {
  const assessment: RiskAssessmentResult = {
    score: 1,
    level: "LOW",
    factors: [],
  };

  const comment = formatRiskComment(assessment);
  assert.match(comment, /\*No specific risk factors triggered\.\*/);
  assert.match(comment, /### Recommendation\nLow risk: no immediate action/);
});

test("publishRiskComment makes expected fetch call and returns data", async () => {
  const assessment: RiskAssessmentResult = {
    score: 1,
    level: "LOW",
    factors: [],
  };

  const mockTokenResponse = {
    token: "mock-token-999",
    expires_at: "2026-06-06T00:00:00Z",
  };

  const mockCommentResponse = {
    id: 123456,
    html_url: "https://github.com/test-owner/test-repo/issues/42#issuecomment-123456",
  };

  // Mock global fetch
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

    if (urlStr.includes("/comments")) {
      return {
        ok: true,
        status: 201,
        statusText: "Created",
        json: async () => mockCommentResponse,
        text: async () => JSON.stringify(mockCommentResponse),
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
    const result = await publishRiskComment({
      installationId: 999,
      owner: "test-owner",
      repo: "test-repo",
      prNumber: 42,
      assessment,
      explanation: "A simple low risk change.",
    });

    assert.strictEqual(fetchCalls.length, 2);

    // Assert token call
    const tokenCall = fetchCalls[0]!;
    assert.strictEqual(tokenCall.url, "https://api.github.com/app/installations/999/access_tokens");
    assert.strictEqual(tokenCall.options.method, "POST");
    const tokenHeaders = tokenCall.options.headers as Record<string, string>;
    assert.match(tokenHeaders["Authorization"], /^Bearer /);

    // Assert comment call
    const commentCall = fetchCalls[1]!;
    assert.strictEqual(commentCall.url, "https://api.github.com/repos/test-owner/test-repo/issues/42/comments");
    assert.strictEqual(commentCall.options.method, "POST");
    const commentHeaders = commentCall.options.headers as Record<string, string>;
    assert.strictEqual(commentHeaders["Authorization"], "token mock-token-999");
    assert.strictEqual(commentHeaders["Accept"], "application/vnd.github+json");
    assert.strictEqual(commentHeaders["X-GitHub-Api-Version"], "2022-11-28");
    assert.strictEqual(commentHeaders["Content-Type"], "application/json");

    // Assert comment body
    const body = JSON.parse(commentCall.options.body as string);
    assert.match(body.body, /## 🔍 ContextHub Risk Assessment/);
    assert.match(body.body, /### Explanation\nA simple low risk change\./);

    // Assert result
    assert.strictEqual(result.commentId, 123456);
    assert.strictEqual(result.htmlUrl, mockCommentResponse.html_url);
  } finally {
    // Restore fetch
    globalThis.fetch = originalFetch;
  }
});
