// risk domain — services
// Single export point for all risk domain services.
// Business logic lives in engine.ts — import from there, not from this barrel,
// when tree-shaking matters. This file is provided for domain-level discoverability.

export { generateRiskFactors, scoreRisk } from "./engine";
export { explainRiskAssessment } from "./explainer";
export type { ExplainerInput, ExplainerOutput } from "./explainer";
export { sendSlackAlert } from "./slack";
export type { SendSlackAlertInput } from "./slack";

