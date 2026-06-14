import { z } from "zod";

export const IncidentInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.string().min(1, "Severity is required"),
  status: z.string().min(1, "Status is required"),
  services: z.array(z.string()).min(1, "At least one service is required"),
});

export type IncidentInput = z.infer<typeof IncidentInputSchema>;
