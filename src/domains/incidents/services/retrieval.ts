import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

/**
 * Shape of a row returned by the raw SQL keyword/vector queries.
 * Both queries SELECT the same columns so a single interface covers both.
 */
interface RawIncidentRow {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: Date | string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: Date;
  score: number; // fused RRF score
}

/**
 * Performs a hybrid search over incidents using both keyword full-text search (FTS)
 * and vector cosine similarity search (pgvector), combining results via Reciprocal Rank Fusion (RRF).
 */
export async function hybridSearchIncidents(
  organizationId: string,
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return [];
  }

  // 1. Generate query embedding
  const queryVector = await generateEmbedding(cleanQuery);
  const queryVectorStr = `[${queryVector.join(",")}]`;

  // 2. Perform FTS Keyword search
  const keywordQuery = sql`
    SELECT id, title, description, severity, status, created_at,
           ts_rank(to_tsvector('english', title || ' ' || description), plainto_tsquery('english', ${cleanQuery})) as rank
    FROM incidents
    WHERE organization_id = ${organizationId}
      AND to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${cleanQuery})
    ORDER BY rank DESC
    LIMIT 50
  `;

  // 3. Perform Vector Cosine Similarity search (<=> computes cosine distance, 1 - distance = similarity)
  const vectorQuery = sql`
    SELECT id, title, description, severity, status, created_at,
           (1 - (description_vector <=> ${queryVectorStr}::vector)) as similarity
    FROM incidents
    WHERE organization_id = ${organizationId}
      AND description_vector IS NOT NULL
    ORDER BY description_vector <=> ${queryVectorStr}::vector ASC
    LIMIT 50
  `;

  // Execute queries in parallel
  const [keywordResultsRaw, vectorResultsRaw] = await Promise.all([
    db.execute(keywordQuery),
    db.execute(vectorQuery),
  ]);

  // Handle driver differences (postgres-js returns rows array directly; other drivers return { rows: [] })
  const keywordResults: RawIncidentRow[] = Array.isArray(keywordResultsRaw)
    ? (keywordResultsRaw as unknown as RawIncidentRow[])
    : (((keywordResultsRaw as { rows?: unknown }).rows as RawIncidentRow[]) ?? []);
  const vectorResults: RawIncidentRow[] = Array.isArray(vectorResultsRaw)
    ? (vectorResultsRaw as unknown as RawIncidentRow[])
    : (((vectorResultsRaw as { rows?: unknown }).rows as RawIncidentRow[]) ?? []);

  // 4. Reciprocal Rank Fusion (RRF)
  // RRF Score = Sum_m ( 1 / (k + rank_m) )
  const k = 60;
  const scores: Record<string, { doc: RawIncidentRow; keywordRank?: number; vectorRank?: number }> = {};

  keywordResults.forEach((doc: RawIncidentRow, index: number) => {
    scores[doc.id] = { doc, keywordRank: index + 1 };
  });

  vectorResults.forEach((doc: RawIncidentRow, index: number) => {
    if (scores[doc.id]) {
      scores[doc.id]!.vectorRank = index + 1;
    } else {
      scores[doc.id] = { doc, vectorRank: index + 1 };
    }
  });

  const fusedResults = Object.values(scores).map(({ doc, keywordRank, vectorRank }) => {
    let score = 0;
    if (keywordRank !== undefined) {
      score += 1 / (k + keywordRank);
    }
    if (vectorRank !== undefined) {
      score += 1 / (k + vectorRank);
    }
    return {
      id: doc.id as string,
      title: doc.title as string,
      description: doc.description as string,
      severity: doc.severity as string,
      status: doc.status as string,
      created_at: new Date(doc.created_at),
      score,
    };
  });

  // Sort by fused score descending
  fusedResults.sort((a, b) => b.score - a.score);

  return fusedResults.slice(0, limit);
}
