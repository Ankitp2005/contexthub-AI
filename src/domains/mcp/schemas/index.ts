// mcp domain — schemas
// Zod validation for all MCP tool inputs.
// Per engineerstandards.md, every external input must be validated with Zod.
// See docs/mcp_spec.md for the authoritative input schemas.

import { z } from "zod";

/** Input schema for the score_change tool. */
export const ScoreChangeInputSchema = z.object({
  repositoryId: z.string().min(1, "repositoryId is required").max(500),
  files: z.array(z.string().max(1000)).min(1, "at least one file path is required").max(100),
  diff: z.string().max(500_000, "diff too large"),
});

/** Input schema for the get_ownership tool. */
export const GetOwnershipInputSchema = z.object({
  repositoryId: z.string().min(1, "repositoryId is required").max(500),
  filePath: z.string().min(1, "filePath is required").max(2000),
});

/** Input schema for the get_constraints tool. */
export const GetConstraintsInputSchema = z.object({
  repositoryId: z.string().min(1, "repositoryId is required").max(500),
  scope: z.string().min(1, "scope is required").max(500),
});

export type ScoreChangeInput = z.infer<typeof ScoreChangeInputSchema>;
export type GetOwnershipInput = z.infer<typeof GetOwnershipInputSchema>;
export type GetConstraintsInput = z.infer<typeof GetConstraintsInputSchema>;
