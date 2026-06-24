export interface MCPPromptMessage {
  role: "user" | "assistant";
  content: {
    type: "text";
    text: string;
  };
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
  messages: MCPPromptMessage[];
}

const PREAMBLE_TEXT =
  "Before you write or modify any files in this codebase, you must always query the ContextHub AI tools to understand the ownership and constraints. Run `get_ownership` for the file path you wish to edit, and `get_constraints` for the scope to verify if any deployment freezes, PCI locks, or review restrictions are active. Maintain security and compliance boundaries at all times.";

const PROMPTS_REGISTRY: Record<string, MCPPrompt> = {
  safe_agent_preamble: {
    name: "safe_agent_preamble",
    description: "Standard preamble instructions for autonomous agents to enforce context lookups",
    arguments: [],
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: PREAMBLE_TEXT,
        },
      },
    ],
  },
};

/**
 * Lists all available MCP prompts.
 */
export async function listPrompts(): Promise<Array<Omit<MCPPrompt, "messages">>> {
  return Object.values(PROMPTS_REGISTRY).map((p) => ({
    name: p.name,
    description: p.description,
    arguments: p.arguments,
  }));
}

/**
 * Retrieves a specific prompt by name.
 */
export async function getPrompt(name: string): Promise<MCPPrompt | null> {
  return PROMPTS_REGISTRY[name] ?? null;
}
