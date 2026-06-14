// risk domain — types

/**
 * Input shape accepted by the deterministic Risk Engine.
 * All fields map 1-to-1 to the risk factors defined in docs/risk-engine.md.
 */
export interface RiskInput {
  /** True when the PR author is not an owner of at least one modified file. */
  ownershipMismatch: boolean;

  /**
   * Number of distinct critical services touched by the PR.
   * Any value >= 1 triggers the CriticalService weight (+4).
   * Any value >= 2 also triggers the MultipleCriticalServices weight (+2).
   */
  criticalPathCount: number;

  /** True when the PR is opened during an active deployment freeze window. */
  deploymentConstraintActive: boolean;

  /** True when any modified service had an incident in the previous 90 days. */
  hasRecentIncident: boolean;

  /** Total number of files changed by the PR. */
  changedFiles: number;

  /** Total lines changed (additions + deletions) by the PR. */
  changedLines: number;
}

/**
 * A single risk factor that was triggered during scoring.
 * Each factor carries its name, the weight it contributed, and a human-readable reason.
 */
export interface RiskFactor {
  name: string;
  weight: number;
  reason: string;
}

/** Risk level bucket as defined in docs/risk-engine.md. */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * The full output produced by the Risk Engine for a single evaluation.
 * Every field is required — partial results must never be returned.
 */
export interface RiskAssessmentResult {
  /** Final risk score, always an integer in [1, 10]. */
  score: number;

  /** Human-readable level bucket corresponding to the score. */
  level: RiskLevel;

  /** Ordered list of all factors that contributed to the score. */
  factors: RiskFactor[];
}
