import { eq, ilike, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  repositories,
  ownership_rules,
  incidents,
  incident_services,
} from "@/lib/db/schema";

export interface CodebaseContextResource {
  repo: string;
  teams: string[];
  ownership: Array<{
    pattern: string;
    ownerType: string;
    ownerName: string;
  }>;
  criticalSystems: string[];
  architectureMetadata: {
    style: string;
    database: string;
    auth: string;
  };
}

export interface IncidentContextResource {
  serviceName: string;
  incidentCount: number;
  recentIncidents: Array<{
    title: string;
    severity: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
  rootCauses: string[];
}

/**
 * Retrieves high-level codebase context for context://codebase/{repo}
 */
export async function getCodebaseContext(
  organizationId: string,
  repoName: string
): Promise<CodebaseContextResource | null> {
  // Try to find the repository by full name or just the name part, scoped to organizationId
  let repoRecord = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.organization_id, organizationId),
        eq(repositories.full_name, repoName)
      )
    )
    .limit(1)
    .then((res) => res[0]);

  if (!repoRecord) {
    repoRecord = await db
      .select()
      .from(repositories)
      .where(
        and(
          eq(repositories.organization_id, organizationId),
          ilike(repositories.name, repoName)
        )
      )
      .limit(1)
      .then((res) => res[0]);
  }

  if (!repoRecord) {
    return null;
  }

  // Load ownership rules
  const rules = await db
    .select()
    .from(ownership_rules)
    .where(eq(ownership_rules.repository_id, repoRecord.id));

  // Extract unique team/owner names
  const teams = Array.from(new Set(rules.map((r) => r.owner_name)));

  // Define some static critical paths as systems
  const criticalSystems = [
    "payments",
    "auth",
    "billing",
    "pii-protection",
    "database-migrations",
  ];

  return {
    repo: repoRecord.full_name,
    teams,
    ownership: rules.map((r) => ({
      pattern: r.path_pattern,
      ownerType: r.owner_type,
      ownerName: r.owner_name,
    })),
    criticalSystems,
    architectureMetadata: {
      style: "Modular Monolith",
      database: "PostgreSQL",
      auth: "Clerk",
    },
  };
}

/**
 * Retrieves incident context for context://incidents/{service}
 */
export async function getIncidentContext(
  organizationId: string,
  serviceName: string
): Promise<IncidentContextResource> {
  const matchingIncidents = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      severity: incidents.severity,
      description: incidents.description,
      status: incidents.status,
      created_at: incidents.created_at,
    })
    .from(incidents)
    .innerJoin(
      incident_services,
      eq(incidents.id, incident_services.incident_id)
    )
    .where(
      and(
        eq(incidents.organization_id, organizationId),
        ilike(incident_services.service_name, serviceName.trim())
      )
    );

  const incidentCount = matchingIncidents.length;
  const rootCauses = matchingIncidents
    .map((inc) => inc.description)
    .filter((desc) => desc.length > 0);

  return {
    serviceName,
    incidentCount,
    recentIncidents: matchingIncidents.map((inc) => ({
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      description: inc.description,
      createdAt: inc.created_at.toISOString(),
    })),
    rootCauses,
  };
}
