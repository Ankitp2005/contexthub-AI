import { z } from "zod";

export const ConstraintInputSchema = z.object({
  scope: z.string().min(1, "Scope is required"),
  constraint_type: z.string().min(1, "Constraint type is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.string().min(1, "Severity is required"),
});

export type ConstraintInput = z.infer<typeof ConstraintInputSchema>;
