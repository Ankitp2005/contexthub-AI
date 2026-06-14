import * as repo from "../repositories";

export interface OwnershipContext {
  ownerType: "user" | "team" | "email" | "none";
  ownerName: string;
  source: "CODEOWNERS";
}

/**
 * Normalizes a CODEOWNERS path pattern for matching.
 * E.g., "/src/payments/*" -> "src/payments"
 */
export function normalizePattern(pattern: string): string {
  if (pattern === "*") return "*";
  return pattern.replace(/\*/g, "").replace(/^\//, "");
}

/**
 * Evaluates whether a file path matches a normalized path pattern.
 */
export function isPathMatch(filePath: string, pattern: string): boolean {
  if (pattern === "*") return true;
  const normalized = normalizePattern(pattern);
  return filePath.startsWith(normalized) || filePath.includes(normalized);
}

/**
 * Evaluates ownership for a given file path based on a list of rules.
 *
 * Implements CODEOWNERS precedence rules (last matching pattern takes precedence).
 */
export function evaluateOwnership(
  rules: Array<{ path_pattern: string; owner_type: string; owner_name: string }>,
  filePath: string
): OwnershipContext {
  // Search rules in reverse order (last matching pattern takes precedence)
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i]!;
    if (isPathMatch(filePath, rule.path_pattern)) {
      return {
        ownerType: rule.owner_type as "user" | "team" | "email",
        ownerName: rule.owner_name,
        source: "CODEOWNERS",
      };
    }
  }

  // Fallback if no matching rules are found
  return {
    ownerType: "none",
    ownerName: "unowned",
    source: "CODEOWNERS",
  };
}

/**
 * Retrieves the ownership information for a specific file path within a repository.
 */
export async function getFileOwnership(
  repositoryId: string,
  filePath: string
): Promise<OwnershipContext> {
  const rules = await repo.getOwnershipRulesForRepository(repositoryId);
  return evaluateOwnership(rules, filePath);
}
