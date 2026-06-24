// src/domains/mcp/services/incident-tool.ts
//
// MCP Tool: get_incident_context
//
// Returns structured incident context for a service name — how many incidents,
// which are recent, and a summary of root causes. Backed entirely by the DB;
// no external API calls.

import { z } from "zod";
import { getIncidentContext as _getIncidentContext } from "./resources";
import type { IncidentContextResource } from "./resources";

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------
export const GetIncidentContextInputSchema = z.object({
  serviceName: z.string().min(1, "serviceName is required"),
});

export type GetIncidentContextInput = z.infer<typeof GetIncidentContextInputSchema>;
export type { IncidentContextResource };

// ---------------------------------------------------------------------------
// Service — thin wrapper around the existing resources implementation
// ---------------------------------------------------------------------------
export async function getIncidentContextTool(
  input: GetIncidentContextInput,
  organizationId: string
): Promise<IncidentContextResource | null> {
  return _getIncidentContext(organizationId, input.serviceName);
}
