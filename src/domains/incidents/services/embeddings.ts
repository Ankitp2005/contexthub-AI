/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\r?\n/g, " ").trim();
  if (!cleanText) {
    return new Array(1536).fill(0);
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMENI_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: {
              parts: [{ text: cleanText }],
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json() as any;
        const values = data?.embedding?.values;
        if (Array.isArray(values)) {
          // Gemini returns 768 dimensions. Pad with 768 zeros to fit vector(1536)
          const padded = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(values.length, 1536); i++) {
            padded[i] = values[i];
          }
          return padded;
        }
      }
      console.warn(`[Embeddings] Gemini API returned status ${response.status}. Falling back.`);
    } catch (err) {
      console.error("[Embeddings] Gemini fetch error:", err);
    }
  }

  if (openAIKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: cleanText,
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const embedding = data?.data?.[0]?.embedding;
        if (Array.isArray(embedding)) {
          return embedding;
        }
      }
      console.warn(`[Embeddings] OpenAI API returned status ${response.status}. Falling back.`);
    } catch (err) {
      console.error("[Embeddings] OpenAI fetch error:", err);
    }
  }

  // Fallback: Mock embedding (deterministic float array based on simple character code hashing)
  console.warn("[Embeddings] No active embedding API succeeded. Using hash fallback.");
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < Math.min(cleanText.length, 1536); i++) {
    const charCode = cleanText.charCodeAt(i);
    embedding[i] = Math.sin(charCode + i) * 0.1;
  }
  return embedding;
}
