import { test } from "node:test";
import assert from "node:assert";
import { sendSlackAlert } from "../slack";

test("sendSlackAlert returns false and does not call fetch when score is below threshold", async () => {
  const originalEnvThreshold = process.env.SLACK_RISK_THRESHOLD;
  const originalEnvUrl = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  process.env.SLACK_RISK_THRESHOLD = "7";
  process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true } as Response;
  };

  try {
    const result = await sendSlackAlert({
      score: 5,
      level: "MEDIUM",
      repoFullName: "test-owner/test-repo",
      prNumber: 12,
      factors: [{ name: "OwnershipMismatch", weight: 3, reason: "non-owner" }],
    });

    assert.strictEqual(result, false);
    assert.strictEqual(fetchCalled, false);
  } finally {
    process.env.SLACK_RISK_THRESHOLD = originalEnvThreshold;
    process.env.SLACK_WEBHOOK_URL = originalEnvUrl;
    globalThis.fetch = originalFetch;
  }
});

test("sendSlackAlert returns false and does not call fetch when SLACK_WEBHOOK_URL is missing", async () => {
  const originalEnvThreshold = process.env.SLACK_RISK_THRESHOLD;
  const originalEnvUrl = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  process.env.SLACK_RISK_THRESHOLD = "7";
  delete process.env.SLACK_WEBHOOK_URL;

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true } as Response;
  };

  try {
    const result = await sendSlackAlert({
      score: 8,
      level: "HIGH",
      repoFullName: "test-owner/test-repo",
      prNumber: 12,
      factors: [{ name: "OwnershipMismatch", weight: 3, reason: "non-owner" }],
    });

    assert.strictEqual(result, false);
    assert.strictEqual(fetchCalled, false);
  } finally {
    process.env.SLACK_RISK_THRESHOLD = originalEnvThreshold;
    process.env.SLACK_WEBHOOK_URL = originalEnvUrl;
    globalThis.fetch = originalFetch;
  }
});

test("sendSlackAlert uses custom threshold from SLACK_RISK_THRESHOLD", async () => {
  const originalEnvThreshold = process.env.SLACK_RISK_THRESHOLD;
  const originalEnvUrl = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  process.env.SLACK_RISK_THRESHOLD = "4";
  process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true } as Response;
  };

  try {
    const result = await sendSlackAlert({
      score: 5,
      level: "MEDIUM",
      repoFullName: "test-owner/test-repo",
      prNumber: 12,
      factors: [{ name: "OwnershipMismatch", weight: 3, reason: "non-owner" }],
    });

    assert.strictEqual(result, true);
    assert.strictEqual(fetchCalled, true);
  } finally {
    process.env.SLACK_RISK_THRESHOLD = originalEnvThreshold;
    process.env.SLACK_WEBHOOK_URL = originalEnvUrl;
    globalThis.fetch = originalFetch;
  }
});

test("sendSlackAlert formats message and calls fetch correctly when score >= threshold", async () => {
  const originalEnvThreshold = process.env.SLACK_RISK_THRESHOLD;
  const originalEnvUrl = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  process.env.SLACK_RISK_THRESHOLD = "7";
  const mockWebhookUrl = "https://hooks.slack.com/services/test/123/456";
  process.env.SLACK_WEBHOOK_URL = mockWebhookUrl;

  let fetchCalled = false;
  let fetchUrl = "";
  let fetchOptions: RequestInit = {};

  globalThis.fetch = async (url, options) => {
    fetchCalled = true;
    fetchUrl = String(url);
    fetchOptions = options || {};
    return {
      ok: true,
      status: 200,
      statusText: "OK",
    } as Response;
  };

  try {
    const result = await sendSlackAlert({
      score: 8,
      level: "HIGH",
      repoFullName: "test-owner/test-repo",
      prNumber: 42,
      prUrl: "https://github.com/test-owner/test-repo/pull/42",
      factors: [
        { name: "OwnershipMismatch", weight: 3, reason: "Modified files owned by Payments" },
        { name: "CriticalService", weight: 4, reason: "Touches critical payment system" }
      ],
    });

    assert.strictEqual(result, true);
    assert.strictEqual(fetchCalled, true);
    assert.strictEqual(fetchUrl, mockWebhookUrl);
    assert.strictEqual(fetchOptions.method, "POST");

    const headers = fetchOptions.headers as Record<string, string>;
    assert.strictEqual(headers["Content-Type"], "application/json");

    const body = JSON.parse(fetchOptions.body as string);
    assert.match(body.text, /⚠️ \*High Risk Pull Request Detected\*/);
    assert.match(body.text, /\*Repository:\* test-owner\/test-repo/);
    assert.match(body.text, /\*PR:\* \(<https:\/\/github\.com\/test-owner\/test-repo\/pull\/42\|#42>\)/);
    assert.match(body.text, /\*Risk Score:\* 8\/10 — \*HIGH\*/);
    assert.match(body.text, /• \*OwnershipMismatch\* \(\+3\): Modified files owned by Payments/);
    assert.match(body.text, /• \*CriticalService\* \(\+4\): Touches critical payment system/);
  } finally {
    process.env.SLACK_RISK_THRESHOLD = originalEnvThreshold;
    process.env.SLACK_WEBHOOK_URL = originalEnvUrl;
    globalThis.fetch = originalFetch;
  }
});

test("sendSlackAlert returns false when fetch response is not ok", async () => {
  const originalEnvThreshold = process.env.SLACK_RISK_THRESHOLD;
  const originalEnvUrl = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  process.env.SLACK_RISK_THRESHOLD = "7";
  process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/test";

  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "invalid_payload",
    } as Response;
  };

  try {
    const result = await sendSlackAlert({
      score: 9,
      level: "CRITICAL",
      repoFullName: "test-owner/test-repo",
      prNumber: 42,
      factors: [],
    });

    assert.strictEqual(result, false);
  } finally {
    process.env.SLACK_RISK_THRESHOLD = originalEnvThreshold;
    process.env.SLACK_WEBHOOK_URL = originalEnvUrl;
    globalThis.fetch = originalFetch;
  }
});
