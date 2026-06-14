import { ParsedCodeOwner, CodeownersRule, CodeOwnerType } from "../types";

/**
 * Parses the raw string content of a GitHub CODEOWNERS file into a list of rules.
 */
export function parseCodeownersFile(content: string): CodeownersRule[] {
  const rules: CodeownersRule[] = [];
  const lines = content.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    
    // Ignore empty lines and comments
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    // Split by whitespace
    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      continue; // Invalid line without owners
    }

    const pathPattern = parts[0]!;
    const owners: ParsedCodeOwner[] = [];

    for (let i = 1; i < parts.length; i++) {
      const ownerStr = parts[i]!;
      let ownerType: CodeOwnerType = "user";
      let ownerName = ownerStr;

      if (ownerStr.startsWith("@")) {
        // e.g. @username or @org/team-name
        if (ownerStr.includes("/")) {
          ownerType = "team";
          // We remove the @ symbol, storing e.g. "org/team-name"
          ownerName = ownerStr.substring(1);
        } else {
          ownerType = "user";
          ownerName = ownerStr.substring(1);
        }
      } else if (ownerStr.includes("@")) {
        // e.g. user@example.com
        ownerType = "email";
        ownerName = ownerStr;
      } else {
        // Fallback for non-standard but technically allowed identifiers
        ownerType = "user";
        ownerName = ownerStr;
      }

      owners.push({ ownerType, ownerName });
    }

    rules.push({ pathPattern, owners });
  }

  return rules;
}
