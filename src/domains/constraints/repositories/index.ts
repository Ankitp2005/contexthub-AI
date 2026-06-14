import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { deployment_constraints } from "@/lib/db/schema";

/**
 * Retrieves all deployment constraints for a given organization.
 */
export async function getConstraintsForOrganization(organizationId: string) {
  return db
    .select()
    .from(deployment_constraints)
    .where(eq(deployment_constraints.organization_id, organizationId));
}

export async function createConstraint(data: {
  id: string;
  organization_id: string;
  scope: string;
  constraint_type: string;
  description: string;
  severity: string;
}) {
  const [constraint] = await db
    .insert(deployment_constraints)
    .values(data)
    .returning();
  return constraint!;
}

export async function deleteConstraint(id: string, organizationId: string) {
  return db
    .delete(deployment_constraints)
    .where(
      and(
        eq(deployment_constraints.id, id),
        eq(deployment_constraints.organization_id, organizationId)
      )
    );
}
