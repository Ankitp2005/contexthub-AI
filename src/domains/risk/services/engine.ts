// risk domain — engine
// Authoritative source of truth for all risk calculations.
// See docs/risk-engine.md for the full specification.
//
// Rules:
//  - No AI / ML / LLM / semantic similarity / vector search.
//  - Pure functions: identical inputs always produce identical outputs.
//  - Score is capped to [1, 10] after applying all weights + overrides.
//  - generateRiskFactors() is the single source of factor truth.
//  - scoreRisk() derives the numeric result from generateRiskFactors().

import type { RiskAssessmentResult, RiskFactor, RiskInput, RiskLevel } from "../types";

// ---------------------------------------------------------------------------
// Constants — weights and thresholds are taken verbatim from docs/risk-engine.md
// ---------------------------------------------------------------------------

const WEIGHT_OWNERSHIP_MISMATCH = 3;
const WEIGHT_CRITICAL_SERVICE = 4;
const WEIGHT_DEPLOYMENT_FREEZE = 3;
const WEIGHT_RECENT_INCIDENT = 2;
const WEIGHT_LARGE_CHANGE_SET = 1;        // triggered when changedFiles > 25
const WEIGHT_EXCESSIVE_LOC = 1;           // triggered when changedLines > 500
const WEIGHT_MULTIPLE_CRITICAL_SERVICES = 2; // triggered when criticalPathCount >= 2
const WEIGHT_BLAST_RADIUS_PER_DEP = 1;    // +1 per direct dependent, capped at +3
const WEIGHT_BLAST_RADIUS_MAX = 3;

const THRESHOLD_LARGE_CHANGE_SET = 25;
const THRESHOLD_EXCESSIVE_LOC = 500;

const BASE_SCORE = 1;
const SCORE_MIN = 1;
const SCORE_MAX = 10;

// Critical-override minimum scores (docs/risk-engine.md § Critical Overrides)
const OVERRIDE_CRITICAL_AND_FREEZE_MIN = 9;

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveLevel(score: number): RiskLevel {
  if (score <= 3) return "LOW";
  if (score <= 6) return "MEDIUM";
  if (score <= 8) return "HIGH";
  return "CRITICAL";
}

// ---------------------------------------------------------------------------
// Public API — Factor Generation
// ---------------------------------------------------------------------------

/**
 * generateRiskFactors — Evaluates all risk conditions and returns every
 * triggered factor with its name, weight, and reason.
 *
 * This is the single source of truth for which factors fire and why.
 * scoreRisk() MUST derive the numeric score exclusively from this output,
 * ensuring that factors always map directly to the score (no hidden logic).
 *
 * Contract:
 *  - Pure function — no side effects, no I/O, no randomness.
 *  - Returns only factors whose condition evaluated to true.
 *  - The sum of all returned weights, added to BASE_SCORE (1), gives the
 *    raw score before overrides and clamping.
 *
 * Factors (from docs/risk-engine.md § Risk Factors):
 *
 *  ┌──────────────────────────────┬────────┬──────────────────────────────────┐
 *  │ Factor                       │ Weight │ Trigger condition                │
 *  ├──────────────────────────────┼────────┼──────────────────────────────────┤
 *  │ OwnershipMismatch            │   +3   │ ownershipMismatch === true        │
 *  │ CriticalService              │   +4   │ criticalPathCount >= 1           │
 *  │ DeploymentFreezeViolation    │   +3   │ deploymentConstraintActive        │
 *  │ RecentIncident               │   +2   │ hasRecentIncident === true        │
 *  │ LargeChangeSet               │   +1   │ changedFiles > 25                │
 *  │ ExcessiveLOC                 │   +1   │ changedLines > 500               │
 *  │ MultipleCriticalServices     │   +2   │ criticalPathCount >= 2           │
 *  │ HighBlastRadius              │  +1–3  │ directDependentCount >= 1        │
 *  └──────────────────────────────┴────────┴──────────────────────────────────┘
 *
 * @param input - Validated RiskInput.
 * @returns Array of all triggered RiskFactor objects. Empty when no factors fire.
 */
export function generateRiskFactors(input: RiskInput): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // 1. Ownership Mismatch (+3)
  if (input.ownershipMismatch) {
    factors.push({
      name: "OwnershipMismatch",
      weight: WEIGHT_OWNERSHIP_MISMATCH,
      reason: "PR modifies files owned by a team different from the author.",
    });
  }

  // 2. Critical Service (+4) — any critical path touched
  if (input.criticalPathCount >= 1) {
    factors.push({
      name: "CriticalService",
      weight: WEIGHT_CRITICAL_SERVICE,
      reason: `PR modifies ${input.criticalPathCount} critical service(s).`,
    });
  }

  // 3. Deployment Freeze Violation (+3)
  if (input.deploymentConstraintActive) {
    factors.push({
      name: "DeploymentFreezeViolation",
      weight: WEIGHT_DEPLOYMENT_FREEZE,
      reason: "PR is opened during an active deployment freeze window.",
    });
  }

  // 4. Recent Incident Area (+2)
  if (input.hasRecentIncident) {
    factors.push({
      name: "RecentIncident",
      weight: WEIGHT_RECENT_INCIDENT,
      reason:
        "PR modifies a service associated with an incident in the previous 90 days.",
    });
  }

  // 5a. Large Change Set (+1) — more than 25 files
  if (input.changedFiles > THRESHOLD_LARGE_CHANGE_SET) {
    factors.push({
      name: "LargeChangeSet",
      weight: WEIGHT_LARGE_CHANGE_SET,
      reason: `PR modifies ${input.changedFiles} files (threshold: ${THRESHOLD_LARGE_CHANGE_SET}).`,
    });
  }

  // 5b. Excessive LOC (+1) — more than 500 lines
  if (input.changedLines > THRESHOLD_EXCESSIVE_LOC) {
    factors.push({
      name: "ExcessiveLOC",
      weight: WEIGHT_EXCESSIVE_LOC,
      reason: `PR changes ${input.changedLines} lines (threshold: ${THRESHOLD_EXCESSIVE_LOC}).`,
    });
  }

  // 6. Multiple Critical Services (+2) — two or more critical paths touched
  if (input.criticalPathCount >= 2) {
    factors.push({
      name: "MultipleCriticalServices",
      weight: WEIGHT_MULTIPLE_CRITICAL_SERVICES,
      reason: `PR touches ${input.criticalPathCount} critical services simultaneously.`,
    });
  }

  // 7. High Blast Radius (+1 per direct dependent, max +3)
  const directDeps = input.directDependentCount ?? 0;
  if (directDeps >= 1) {
    const blastWeight = Math.min(
      directDeps * WEIGHT_BLAST_RADIUS_PER_DEP,
      WEIGHT_BLAST_RADIUS_MAX
    );
    factors.push({
      name: "HighBlastRadius",
      weight: blastWeight,
      reason: `This repository has ${directDeps} direct downstream dependent(s) — a change here may break them.`,
    });
  }

  return factors;
}

// ---------------------------------------------------------------------------
// Public API — Scoring
// ---------------------------------------------------------------------------

/**
 * scoreRisk — Deterministic Risk Engine (Version 1).
 *
 * Computes the final risk score by:
 *   1. Calling generateRiskFactors() to collect all triggered factors.
 *   2. Summing their weights on top of BASE_SCORE (1).
 *   3. Applying critical overrides (score floor rules).
 *   4. Clamping the result to [1, 10].
 *
 * Because this function delegates factor collection entirely to
 * generateRiskFactors(), the returned factors array always maps directly
 * to the returned score — there is no hidden weight logic.
 *
 * Formula (docs/risk-engine.md § Score Calculation):
 *
 *   rawScore  = BASE (1) + sum(factor.weight for each triggered factor)
 *   override  = max(rawScore, OVERRIDE_FLOOR) when override conditions met
 *   finalScore = clamp(override, 1, 10)
 *
 * @param input - Validated RiskInput.
 * @returns A fully populated RiskAssessmentResult.
 */
export function scoreRisk(input: RiskInput): RiskAssessmentResult {
  // Delegate all factor evaluation to the dedicated factor generator.
  const factors = generateRiskFactors(input);

  // Raw score = base + sum of all triggered weights.
  const rawScore =
    BASE_SCORE +
    factors.reduce((sum, factor) => sum + factor.weight, 0);

  // -------------------------------------------------------------------------
  // Critical Overrides (docs/risk-engine.md § Critical Overrides)
  // Applied after raw summation, before clamping.
  // -------------------------------------------------------------------------

  const touchesCriticalService = input.criticalPathCount >= 1;

  let overriddenScore = rawScore;

  // Override 1: CriticalService + DeploymentFreeze → minimum 9
  if (touchesCriticalService && input.deploymentConstraintActive) {
    overriddenScore = Math.max(overriddenScore, OVERRIDE_CRITICAL_AND_FREEZE_MIN);
  }

  // -------------------------------------------------------------------------
  // Normalisation
  // -------------------------------------------------------------------------

  const finalScore = clamp(overriddenScore, SCORE_MIN, SCORE_MAX);

  return {
    score: finalScore,
    level: resolveLevel(finalScore),
    factors,
  };
}
