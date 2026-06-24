// risk domain — schemas

import { z } from "zod";

/**
 * Zod schema for validating all external inputs entering the Risk Engine.
 *
 * Per engineerstandards.md, every external input must be validated with Zod
 * before being passed into domain services.
 *
 * Field rules are derived directly from docs/risk-engine.md:
 *  - changedFiles  ≥ 0
 *  - changedLines  ≥ 0
 *  - criticalPathCount ≥ 0
 */
export const RiskInputSchema = z.object({
  ownershipMismatch: z.boolean(),
  criticalPathCount: z.number().int().min(0),
  deploymentConstraintActive: z.boolean(),
  hasRecentIncident: z.boolean(),
  changedFiles: z.number().int().min(0),
  changedLines: z.number().int().min(0),
  /** Number of direct downstream dependents — optional, defaults to 0 */
  directDependentCount: z.number().int().min(0).default(0),
});

export type RiskInputSchemaType = z.infer<typeof RiskInputSchema>;
