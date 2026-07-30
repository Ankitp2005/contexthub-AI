import { z } from "zod";

export const IncidentInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  description: z.string().min(1, "Description is required").max(10_000, "Description too long"),
  severity: z.string().min(1, "Severity is required").max(50, "Severity too long"),
  status: z.string().min(1, "Status is required").max(50, "Status too long"),
  services: z.array(z.string().max(500)).min(1, "At least one service is required").max(100, "Too many services"),
});

export type IncidentInput = z.infer<typeof IncidentInputSchema>;
