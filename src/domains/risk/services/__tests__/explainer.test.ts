import { test, mock } from "node:test";
import assert from "node:assert";
import { explainRiskAssessment } from "../explainer";

test("explainRiskAssessment calls Gemini API when GEMENI_API_KEY is configured", async () => {
  // Store original environment variables and fetch
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  process.env.GEMENI_API_KEY = "mock-gemini-key";
  delete process.env.OPENAI_API_KEY;

  let fetchUrlCalled = "";
  let fetchBody: any = null;

  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
    fetchUrlCalled = url.toString();
    fetchBody = JSON.parse(options?.body as string);
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "Gemini explanation: High risk change." }],
            },
          },
        ],
      }),
    } as Response;
  };

  try {
    const result = await explainRiskAssessment({
      score: 8,
      level: "HIGH",
      factors: [{ name: "CriticalService", weight: 4, reason: "Touches payments service" }],
    });

    assert.strictEqual(result.aiGenerated, true);
    assert.strictEqual(result.summary, "Gemini explanation: High risk change.");
    assert.ok(fetchUrlCalled.includes("generativelanguage.googleapis.com"));
    assert.ok(fetchUrlCalled.includes("gemini-2.5-flash"));
    assert.strictEqual(fetchBody.contents[0].parts[0].text.includes("Touches payments service"), true);
  } finally {
    // Restore
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  }
});

test("explainRiskAssessment calls OpenAI API when only OPENAI_API_KEY is configured", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  process.env.OPENAI_API_KEY = "mock-openai-key";
  delete process.env.GEMENI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  let fetchUrlCalled = "";
  let fetchBody: any = null;

  globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
    fetchUrlCalled = url.toString();
    fetchBody = JSON.parse(options?.body as string);
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { content: "OpenAI explanation: High risk change." },
          },
        ],
      }),
    } as Response;
  };

  try {
    const result = await explainRiskAssessment({
      score: 8,
      level: "HIGH",
      factors: [{ name: "CriticalService", weight: 4, reason: "Touches payments service" }],
    });

    assert.strictEqual(result.aiGenerated, true);
    assert.strictEqual(result.summary, "OpenAI explanation: High risk change.");
    assert.ok(fetchUrlCalled.includes("api.openai.com"));
    assert.strictEqual(fetchBody.model, "gpt-4o-mini");
  } finally {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  }
});

test("explainRiskAssessment falls back to deterministic template when no API keys are configured", async () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMENI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: false } as Response;
  };

  try {
    const result = await explainRiskAssessment({
      score: 8,
      level: "HIGH",
      factors: [{ name: "CriticalService", weight: 4, reason: "Touches payments service" }],
    });

    assert.strictEqual(result.aiGenerated, false);
    assert.strictEqual(fetchCalled, false);
    assert.ok(result.summary.includes("This change has a risk score of 8/10"));
    assert.ok(result.summary.includes("CriticalService (+4): Touches payments service"));
  } finally {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  }
});
