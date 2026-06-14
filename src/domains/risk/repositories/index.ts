// risk domain — repositories
// Data access for risk_assessments and risk_factors tables.
// See docs/database.md for column definitions.
// No business logic here — only DB reads and writes.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { risk_assessments, risk_factors } from "@/lib/db/schema";
import type { RiskAssessmentResult } from "../types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Row returned after storing a risk assessment. */
export interface StoredRiskAssessment {
  id: string;
  pull_request_id: string;
  risk_score: string;   // numeric columns come back as string from postgres.js
  risk_level: string;
  reasoning: string;
  created_at: Date;
}

/** Row returned after storing a risk factor. */
export interface StoredRiskFactor {
  id: string;
  risk_assessment_id: string;
  factor_type: string;
  weight: string;       // numeric columns come back as string from postgres.js
  description: string;
  created_at: Date;
}

/** Full assessment with its child factors. */
export interface StoredRiskAssessmentWithFactors {
  assessment: StoredRiskAssessment;
  factors: StoredRiskFactor[];
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * storeRiskAssessment — Persists a completed risk assessment and all its
 * triggered factors in a single logical operation.
 *
 * Mapping from RiskAssessmentResult to DB columns:
 *   result.score        → risk_assessments.risk_score
 *   result.level        → risk_assessments.risk_level
 *   factor.name         → risk_factors.factor_type
 *   factor.weight       → risk_factors.weight
 *   factor.reason       → risk_factors.description
 *
 * The `reasoning` column stores a structured, non-AI summary of the triggered
 * factors (e.g. "Score: 8 | Level: HIGH | Factors: OwnershipMismatch,CriticalService").
 * This satisfies the NOT NULL constraint without using generated natural language.
 *
 * @param pullRequestId - Internal UUID of the pull_requests row.
 * @param result        - The RiskAssessmentResult produced by scoreRisk().
 * @returns The stored assessment row and all stored factor rows.
 */
export async function storeRiskAssessment(
  pullRequestId: string,
  result: RiskAssessmentResult,
): Promise<StoredRiskAssessmentWithFactors> {
  const assessmentId = crypto.randomUUID();

  // Build structured reasoning from triggered factor names — no AI, no prose.
  const factorNames =
    result.factors.length > 0
      ? result.factors.map((f) => f.name).join(",")
      : "none";

  const reasoning = `Score: ${result.score} | Level: ${result.level} | Factors: ${factorNames}`;

  // Insert the assessment row.
  const [assessment] = await db
    .insert(risk_assessments)
    .values({
      id: assessmentId,
      pull_request_id: pullRequestId,
      risk_score: String(result.score),
      risk_level: result.level,
      reasoning,
    })
    .returning();

  if (!assessment) {
    throw new Error(
      `Failed to insert risk_assessment for pull_request_id=${pullRequestId}`,
    );
  }

  // Insert one row per triggered factor.
  let factors: StoredRiskFactor[] = [];

  if (result.factors.length > 0) {
    const factorValues = result.factors.map((factor) => ({
      id: crypto.randomUUID(),
      risk_assessment_id: assessmentId,
      factor_type: factor.name,
      weight: String(factor.weight),
      description: factor.reason,
    }));

    factors = await db
      .insert(risk_factors)
      .values(factorValues)
      .returning() as StoredRiskFactor[];
  }

  return { assessment: assessment as StoredRiskAssessment, factors };
}

/**
 * deleteRiskAssessmentsByPullRequestId — Removes all risk assessments (and
 * their child factors via CASCADE) for a given pull request.
 *
 * Called before re-scoring on synchronize events so stale assessments don't
 * accumulate for the same PR.
 *
 * @param pullRequestId - Internal UUID of the pull_requests row.
 */
export async function deleteRiskAssessmentsByPullRequestId(
  pullRequestId: string,
): Promise<void> {
  // Risk factors are deleted automatically if schema has ON DELETE CASCADE.
  // We also delete them explicitly for safety.
  const existing = await db
    .select({ id: risk_assessments.id })
    .from(risk_assessments)
    .where(eq(risk_assessments.pull_request_id, pullRequestId));

  for (const row of existing) {
    await db
      .delete(risk_factors)
      .where(eq(risk_factors.risk_assessment_id, row.id));
  }

  await db
    .delete(risk_assessments)
    .where(eq(risk_assessments.pull_request_id, pullRequestId));
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * findRiskAssessmentByPullRequestId — Returns the most recent risk assessment
 * for a given pull request, including all of its child risk factor rows.
 *
 * @param pullRequestId - Internal UUID of the pull_requests row.
 * @returns The assessment with factors, or null if none exists.
 */
export async function findRiskAssessmentByPullRequestId(
  pullRequestId: string,
): Promise<StoredRiskAssessmentWithFactors | null> {
  const assessmentRows = await db
    .select()
    .from(risk_assessments)
    .where(eq(risk_assessments.pull_request_id, pullRequestId))
    .orderBy(risk_assessments.created_at)
    .limit(1);

  const assessment = assessmentRows[0];
  if (!assessment) return null;

  const factorRows = await db
    .select()
    .from(risk_factors)
    .where(eq(risk_factors.risk_assessment_id, assessment.id));

  return {
    assessment: assessment as StoredRiskAssessment,
    factors: factorRows as StoredRiskFactor[],
  };
}

/**
 * findRiskAssessmentById — Returns a specific risk assessment by its own ID,
 * including all of its child risk factor rows.
 *
 * @param assessmentId - Primary key of the risk_assessments row.
 * @returns The assessment with factors, or null if not found.
 */
export async function findRiskAssessmentById(
  assessmentId: string,
): Promise<StoredRiskAssessmentWithFactors | null> {
  const assessmentRows = await db
    .select()
    .from(risk_assessments)
    .where(eq(risk_assessments.id, assessmentId))
    .limit(1);

  const assessment = assessmentRows[0];
  if (!assessment) return null;

  const factorRows = await db
    .select()
    .from(risk_factors)
    .where(eq(risk_factors.risk_assessment_id, assessmentId));

  return {
    assessment: assessment as StoredRiskAssessment,
    factors: factorRows as StoredRiskFactor[],
  };
}
