import { z } from "zod";

export const ConstraintInputSchema = z.object({
  scope: z.string().min(1, "Scope is required").max(500, "Scope too long"),
  constraint_type: z.string().min(1, "Constraint type is required").max(100, "Constraint type too long"),
  description: z.string().min(1, "Description is required").max(10_000, "Description too long"),
  severity: z.string().min(1, "Severity is required").max(50, "Severity too long"),
});

export type ConstraintInput = z.infer<typeof ConstraintInputSchema>;
