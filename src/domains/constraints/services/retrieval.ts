import { findRepositoryById } from "../../github/repositories";
import { getConstraintsForOrganization } from "../repositories";
import type { ConstraintEntry } from "../types";

/**
 * Evaluates whether a constraint is applicable for a given scope.
 * 
 * Rules:
 *   - scope is equal to the constraint's scope
 *   - OR constraint's scope is '*'
 *   - OR constraint's scope is 'global'
 */
export function isConstraintApplicable(constraintScope: string, targetScope: string): boolean {
  return (
    constraintScope === targetScope ||
    constraintScope === "*" ||
    constraintScope === "global"
  );
}

/**
 * Retrieves applicable deployment constraints for a repository filtered by scope.
 */
export async function getApplicableConstraints(
  repositoryId: string,
  scope: string
): Promise<ConstraintEntry[]> {
  const repo = await findRepositoryById(repositoryId);
  if (!repo) {
    return [];
  }

  const rows = await getConstraintsForOrganization(repo.organization_id);

  const filtered = rows.filter((c) => isConstraintApplicable(c.scope, scope));

  return filtered.map((c) => ({
    type: c.constraint_type,
    description: c.description,
  }));
}
