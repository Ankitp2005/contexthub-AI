// risk domain — explainer
// Converts stored RiskFactor[] into a human-readable explanation.
//
// Rules (from prompt13.md and techstack.md):
//  - AI may: explain
//  - AI may not: change score, change ownership, change constraints
//  - The explanation is derived solely from the stored factors already computed
//    by the deterministic engine — the LLM receives only those factors as input.
//  - The LLM never sees raw PR data and cannot influence the score or ownership.
//  - Uses native fetch (Node 18+ / Next.js built-in) — no new dependencies.
//  - Falls back to a deterministic template explanation on any LLM failure.

import type { RiskFactor, RiskLevel } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input to the explanation generator — only what the LLM is allowed to see. */
export interface ExplainerInput {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

/** Output of the explanation generator. */
export interface ExplainerOutput {
  summary: string;
  /** true = LLM-generated, false = deterministic fallback */
  aiGenerated: boolean;
}

// ---------------------------------------------------------------------------
// Deterministic fallback
// Used when the LLM call fails or OPENAI_API_KEY is not configured.
// Produces a consistent, readable summary from the stored factors.
// ---------------------------------------------------------------------------

function buildFallbackSummary(input: ExplainerInput): string {
  const { score, level, factors } = input;

  if (factors.length === 0) {
    return `This change has a risk score of ${score}/10 (${level}). No specific risk factors were triggered.`;
  }

  const factorLines = factors
    .map((f) => `• ${f.name} (+${f.weight}): ${f.reason}`)
    .join("\n");

  return (
    `This change has a risk score of ${score}/10 (${level}).\n\n` +
    `The following risk factors were identified:\n${factorLines}`
  );
}

// ---------------------------------------------------------------------------
// LLM prompt construction
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `You are a code change risk explainer for an engineering platform.

Your ONLY job is to convert a structured list of risk factors into a clear, concise, human-readable summary.

STRICT RULES — you must never violate these:
1. You MUST NOT change, override, or question the risk score.
2. You MUST NOT change, override, or question ownership assignments.
3. You MUST NOT change, override, or question deployment constraints.
4. You MUST NOT add risk factors that are not in the input.
5. You MUST NOT remove or downplay risk factors that are in the input.
6. Your summary MUST be derived exclusively from the provided factors.
7. Write in plain English. No markdown. No bullet points. 2-4 sentences maximum.
8. Do not start with "I" or "The AI".`;
}

function buildUserPrompt(input: ExplainerInput): string {
  const { score, level, factors } = input;

  const factorText =
    factors.length === 0
      ? "No risk factors were triggered."
      : factors
          .map((f) => `- ${f.name} (weight +${f.weight}): ${f.reason}`)
          .join("\n");

  return `Risk Score: ${score}/10
Risk Level: ${level}

Triggered Risk Factors:
${factorText}

Write a 2-4 sentence human-readable explanation of why this change received this risk score, based only on the factors above.`;
}

// ---------------------------------------------------------------------------
// LLM call via native fetch (no SDK dependency)
// ---------------------------------------------------------------------------

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const messages: OpenAIChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 200,
      temperature: 0,   // temperature=0 ensures deterministic output for same input
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText} — ${errorText}`,
    );
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return content;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nInput data to summarize:\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} — ${errorText}`
    );
  }

  const data = (await response.json()) as any;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  return content;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * explainRiskAssessment — Generates a human-readable explanation of a risk
 * assessment by passing the stored factors to an LLM (Gemini or OpenAI).
 *
 * The LLM is strictly constrained to the explanation role:
 *  - It receives only the score, level, and triggered factors.
 *  - It cannot alter the score, ownership assignments, or constraints.
 *  - It cannot introduce factors not already stored.
 *
 * This ensures the generated summary always matches the stored factors.
 *
 * If the LLM call fails (missing API key, network error, etc.), the function
 * falls back to a deterministic template-based summary so the system remains
 * operational without AI.
 *
 * @param input - The score, level, and stored factors from the risk assessment.
 * @returns An ExplainerOutput with the summary and whether AI was used.
 */
export async function explainRiskAssessment(
  input: ExplainerInput,
): Promise<ExplainerOutput> {
  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(input);

    let summary: string;
    const geminiKey = process.env.GEMENI_API_KEY || process.env.GEMINI_API_KEY;

    if (geminiKey) {
      summary = await callGemini(systemPrompt, userPrompt, geminiKey);
    } else {
      summary = await callOpenAI(systemPrompt, userPrompt);
    }

    return { summary, aiGenerated: true };
  } catch {
    // Fallback: deterministic template — system stays operational without AI.
    const summary = buildFallbackSummary(input);
    return { summary, aiGenerated: false };
  }
}
