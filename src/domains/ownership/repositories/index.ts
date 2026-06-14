import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ownership_rules } from "@/lib/db/schema";
import { CodeownersRule } from "../types";

export async function clearOwnershipRulesForRepository(repositoryId: string) {
  return db
    .delete(ownership_rules)
    .where(eq(ownership_rules.repository_id, repositoryId));
}

export async function storeOwnershipRules(
  repositoryId: string,
  rules: CodeownersRule[]
) {
  if (rules.length === 0) return [];

  const valuesToInsert = rules.flatMap((rule) =>
    rule.owners.map((owner) => ({
      id: crypto.randomUUID(),
      repository_id: repositoryId,
      path_pattern: rule.pathPattern,
      owner_type: owner.ownerType,
      owner_name: owner.ownerName,
      confidence: "1.00",
    }))
  );

  return db.insert(ownership_rules).values(valuesToInsert).returning();
}

/**
 * Convenience method to clear and insert new rules in a single operation
 */
export async function syncOwnershipRules(
  repositoryId: string,
  rules: CodeownersRule[]
) {
  await clearOwnershipRulesForRepository(repositoryId);
  return storeOwnershipRules(repositoryId, rules);
}

/**
 * Retrieves all ownership rules for a given repository.
 */
export async function getOwnershipRulesForRepository(repositoryId: string) {
  return db
    .select()
    .from(ownership_rules)
    .where(eq(ownership_rules.repository_id, repositoryId));
}
