// mcp domain — types
// DTOs returned by each MCP tool. Never raw DB records.
// See docs/mcp_spec.md for the authoritative output schemas.

/** Output of the score_change tool. */
export interface ScoreChangeResult {
  score: number;
  level: string;
  factors: Array<{
    name: string;
    weight: number;
  }>;
  summary: string;
}

/** Output of the get_ownership tool. */
export interface GetOwnershipResult {
  ownerType: string;
  ownerName: string;
  source: "CODEOWNERS";
}

/** A single constraint entry. */
export interface ConstraintEntry {
  type: string;
  description: string;
}

/** Output of the get_constraints tool. */
export interface GetConstraintsResult {
  constraints: ConstraintEntry[];
}
