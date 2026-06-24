// mcp domain — services
// Single export point for all MCP domain services.

export {
  scoreChange,
  getOwnership,
  getConstraints,
  // Pure helpers — exported for testing and dashboard reuse
  countChangedLines,
  detectOwnershipMismatch,
  buildRiskInputFromContext,
} from "./tools";
export type {
  ScoreChangeResult,
  GetOwnershipResult,
  GetConstraintsResult,
  ConstraintEntry,
} from "../types";
export type {
  ScoreChangeInput,
  GetOwnershipInput,
  GetConstraintsInput,
} from "../schemas";
export {
  ScoreChangeInputSchema,
  GetOwnershipInputSchema,
  GetConstraintsInputSchema,
} from "../schemas";
export * from "./resources";
export * from "./prompts";
export {
  getImplicitOwnership,
  GetImplicitOwnershipInputSchema,
} from "./implicit-ownership";
export type {
  GetImplicitOwnershipInput,
  GetImplicitOwnershipResult,
  ImplicitOwnerEntry,
} from "./implicit-ownership";

