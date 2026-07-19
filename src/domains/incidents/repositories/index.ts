import { eq, and, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { incidents, incident_services } from "@/lib/db/schema";
import { generateEmbedding } from "../services/embeddings";

export interface StoredIncidentWithServices {
  id: string;
  organization_id: string;
  title: string;
  severity: string;
  description: string;
  status: string;
  created_at: Date;
  services: string[];
}

export async function getIncidentsForOrganization(
  organizationId: string
): Promise<StoredIncidentWithServices[]> {
  const incidentRows = await db
    .select()
    .from(incidents)
    .where(eq(incidents.organization_id, organizationId))
    .orderBy(incidents.created_at);

  if (incidentRows.length === 0) return [];

  const incidentIds = incidentRows.map((i) => i.id);

  const serviceRows = await db
    .select()
    .from(incident_services)
    .where(inArray(incident_services.incident_id, incidentIds));

  return incidentRows.map((inc) => ({
    ...inc,
    services: serviceRows
      .filter((s) => s.incident_id === inc.id)
      .map((s) => s.service_name),
  }));
}

export async function createIncident(
  data: {
    id: string;
    organization_id: string;
    title: string;
    severity: string;
    description: string;
    status: string;
  },
  services: string[]
) {
  // Generate embedding vector for title + description
  const vectorText = `${data.title}\n${data.description}`;
  const description_vector = await generateEmbedding(vectorText);

  // Insert the main incident row with vector embedding
  const [incident] = await db
    .insert(incidents)
    .values({
      ...data,
      description_vector,
    })
    .returning();

  if (!incident) {
    throw new Error("Failed to insert incident");
  }

  // Insert service rows
  if (services.length > 0) {
    const serviceValues = services.map((name) => ({
      id: crypto.randomUUID(),
      incident_id: incident.id,
      service_name: name.trim(),
    }));
    await db.insert(incident_services).values(serviceValues);
  }

  return incident;
}

export async function deleteIncident(id: string, organizationId: string) {
  // Verify ownership
  const [existing] = await db
    .select()
    .from(incidents)
    .where(and(eq(incidents.id, id), eq(incidents.organization_id, organizationId)))
    .limit(1);

  if (!existing) return;

  // Delete child services first
  await db.delete(incident_services).where(eq(incident_services.incident_id, id));

  // Delete incident
  await db.delete(incidents).where(eq(incidents.id, id));
}

export async function getRecentIncidentServicesForOrganization(
  organizationId: string,
  daysAgo: number = 90
): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysAgo);

  const recentIncidents = await db
    .select({
      serviceName: incident_services.service_name,
    })
    .from(incidents)
    .innerJoin(incident_services, eq(incidents.id, incident_services.incident_id))
    .where(
      and(
        eq(incidents.organization_id, organizationId),
        gte(incidents.created_at, cutoff)
      )
    );

  // Return unique service names
  return Array.from(new Set(recentIncidents.map((r) => r.serviceName)));
}
