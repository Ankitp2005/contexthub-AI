// MCP API Route — src/app/api/mcp/route.ts
//
// This is the HTTP entry point for all MCP tool and resource calls.
// It is a thin layer: authentication, request validation, routing only.
// All business logic lives in src/domains/mcp/services/.
//
// Protocol Support:
//   - Standard JSON-RPC 2.0 (methods: tools/list, tools/call, resources/list, resources/read)
//   - Custom simplified tool call: { "tool": "score_change", "input": { ... } }
//   - Custom simplified resource query: { "resource": "context://codebase/repo" }
//
// Security rules (mcp_spec.md):
//   - Never expose secrets, tokens, or env vars.
//   - Never return raw DB records.
//   - API key validated against MCP_API_KEY env var.

import { NextRequest, NextResponse } from "next/server";
import {
  scoreChange,
  getOwnership,
  getConstraints,
  ScoreChangeInputSchema,
  GetOwnershipInputSchema,
  GetConstraintsInputSchema,
  getCodebaseContext,
  getIncidentContext,
  listPrompts,
  getPrompt,
  getImplicitOwnership,
  GetImplicitOwnershipInputSchema,
  getBlastRadius,
  GetBlastRadiusInputSchema,
} from "@/domains/mcp/services";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { organizations, repositories } from "@/lib/db/schema";
import { createHash, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function safeCompare(a: string, b: string): boolean {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();
  try {
    return timingSafeEqual(aHash, bHash);
  } catch {
    return false;
  }
}

async function authenticate(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  // 1. Check global key fallback
  const globalApiKey = process.env.MCP_API_KEY;
  if (globalApiKey && safeCompare(token, globalApiKey)) {
    return "dev-org-id";
  }

  // 2. Query organizations table to find the organization row where mcp_api_key = token
  const orgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.mcp_api_key, token))
    .limit(1);

  if (orgs.length > 0) {
    return orgs[0].id;
  }

  return null;
}

async function verifyRepositoryOwnership(
  repositoryId: string,
  organizationId: string
): Promise<boolean> {
  const repo = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.id, repositoryId),
        eq(repositories.organization_id, organizationId)
      )
    )
    .limit(1)
    .then((res) => res[0]);
  return !!repo;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // 1. Authentication
  const organizationId = await authenticate(request);
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // Protocol Type A: Standard JSON-RPC 2.0
  // ---------------------------------------------------------------------------
  if ("method" in body) {
    const { method, params, id } = body;
    const jsonrpc = body.jsonrpc || "2.0";

    try {
      switch (method) {
        case "prompts/list": {
          const promptsList = await listPrompts();
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              prompts: promptsList
            }
          });
        }

        case "prompts/get": {
          const name = params?.name;
          if (!name || typeof name !== "string") {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Invalid params: name is required" }
            }, { status: 400 });
          }
          const prompt = await getPrompt(name);
          if (!prompt) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: 404, message: `Prompt not found: ${name}` }
            }, { status: 404 });
          }
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              description: prompt.description,
              messages: prompt.messages
            }
          });
        }

        case "resources/list": {
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              resources: [
                {
                  uri: "context://codebase/{repo}",
                  name: "Codebase Context",
                  description: "Repository ownership, teams, critical paths, and architecture metadata",
                  mimeType: "application/json"
                },
                {
                  uri: "context://incidents/{service}",
                  name: "Incident Context",
                  description: "Operational incident counts and root cause details for a service",
                  mimeType: "application/json"
                }
              ]
            }
          });
        }

        case "resources/read": {
          const uri = params?.uri;
          if (!uri || typeof uri !== "string") {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Invalid params: uri is required" }
            }, { status: 400 });
          }

          if (uri.startsWith("context://codebase/")) {
            const repo = uri.slice("context://codebase/".length);
            const context = await getCodebaseContext(organizationId, repo);
            if (!context) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: 404, message: `Repository not found for: ${repo}` }
              }, { status: 404 });
            }
            return NextResponse.json({
              jsonrpc,
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(context)
                  }
                ]
              }
            });
          } else if (uri.startsWith("context://incidents/")) {
            const service = uri.slice("context://incidents/".length);
            const context = await getIncidentContext(organizationId, service);
            return NextResponse.json({
              jsonrpc,
              id,
              result: {
                contents: [
                  {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(context)
                  }
                ]
              }
            });
          } else {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: `Unsupported resource URI schema: ${uri}` }
            }, { status: 400 });
          }
        }

        case "tools/list": {
          return NextResponse.json({
            jsonrpc,
            id,
            result: {
              tools: [
                {
                  name: "score_change",
                  description: "Evaluate risk of proposed change.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      repositoryId: { type: "string" },
                      files: { type: "array", items: { type: "string" } },
                      diff: { type: "string" }
                    },
                    required: ["repositoryId", "files", "diff"]
                  }
                },
                {
                  name: "get_ownership",
                  description: "Return ownership information.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      repositoryId: { type: "string" },
                      filePath: { type: "string" }
                    },
                    required: ["repositoryId", "filePath"]
                  }
                },
                {
                  name: "get_constraints",
                  description: "Return constraints relevant to scope.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      repositoryId: { type: "string" },
                      scope: { type: "string" }
                    },
                    required: ["repositoryId", "scope"]
                  }
                },
                {
                  name: "get_implicit_ownership",
                  description: "Return implicit ownership confidence scores for a file path, derived from commit activity. Falls back gracefully when no data is available.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      repositoryId: { type: "string" },
                      filePath: { type: "string" }
                    },
                    required: ["repositoryId", "filePath"]
                  }
                },
                {
                  name: "get_blast_radius",
                  description: "Compute the transitive blast radius for a repository — which other repos depend on it directly or transitively. Based on dependency graph (package.json, go.mod, etc).",
                  inputSchema: {
                    type: "object",
                    properties: {
                      repositoryId: { type: "string" }
                    },
                    required: ["repositoryId"]
                  }
                }
              ]
            }
          });
        }

        case "tools/call": {
          const name = params?.name;
          const args = params?.arguments;
          if (!name || !args) {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32602, message: "Invalid params: name and arguments are required" }
            }, { status: 400 });
          }

          if (name === "score_change") {
            const parsed = ScoreChangeInputSchema.safeParse(args);
            if (!parsed.success) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: "Invalid input", data: parsed.error.flatten() }
              }, { status: 400 });
            }
            if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: 403, message: "Forbidden: Repository does not belong to your organization" }
              }, { status: 403 });
            }
            const result = await scoreChange(parsed.data);
            return NextResponse.json({ jsonrpc, id, result });
          } else if (name === "get_ownership") {
            const parsed = GetOwnershipInputSchema.safeParse(args);
            if (!parsed.success) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: "Invalid input", data: parsed.error.flatten() }
              }, { status: 400 });
            }
            if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: 403, message: "Forbidden: Repository does not belong to your organization" }
              }, { status: 403 });
            }
            const result = await getOwnership(parsed.data);
            return NextResponse.json({ jsonrpc, id, result });
          } else if (name === "get_constraints") {
            const parsed = GetConstraintsInputSchema.safeParse(args);
            if (!parsed.success) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: "Invalid input", data: parsed.error.flatten() }
              }, { status: 400 });
            }
            if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: 403, message: "Forbidden: Repository does not belong to your organization" }
              }, { status: 403 });
            }
            const result = await getConstraints(parsed.data);
            return NextResponse.json({ jsonrpc, id, result });
          } else if (name === "get_implicit_ownership") {
            const parsed = GetImplicitOwnershipInputSchema.safeParse(args);
            if (!parsed.success) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: "Invalid input", data: parsed.error.flatten() }
              }, { status: 400 });
            }
            if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: 403, message: "Forbidden: Repository does not belong to your organization" }
              }, { status: 403 });
            }
            const result = await getImplicitOwnership(parsed.data);
            return NextResponse.json({ jsonrpc, id, result });
          } else if (name === "get_blast_radius") {
            const parsed = GetBlastRadiusInputSchema.safeParse(args);
            if (!parsed.success) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: -32602, message: "Invalid input", data: parsed.error.flatten() }
              }, { status: 400 });
            }
            if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
              return NextResponse.json({
                jsonrpc,
                id,
                error: { code: 403, message: "Forbidden: Repository does not belong to your organization" }
              }, { status: 403 });
            }
            const result = await getBlastRadius(parsed.data, organizationId);
            return NextResponse.json({ jsonrpc, id, result });
          } else {
            return NextResponse.json({
              jsonrpc,
              id,
              error: { code: -32601, message: `Method not found: ${name}` }
            }, { status: 404 });
          }
        }

        default:
          return NextResponse.json({
            jsonrpc,
            id,
            error: { code: -32601, message: `Method not found: ${method}` }
          }, { status: 404 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({
        jsonrpc,
        id,
        error: { code: -32603, message }
      }, { status: 500 });
    }
  }

  // ---------------------------------------------------------------------------
  // Protocol Type B: Custom Simplified Resource Query
  // ---------------------------------------------------------------------------
  if ("resource" in body || "uri" in body) {
    const uri = body.resource || body.uri;
    if (typeof uri !== "string") {
      return NextResponse.json({ error: "resource or uri field must be a string" }, { status: 400 });
    }

    try {
      if (uri.startsWith("context://codebase/")) {
        const repo = uri.slice("context://codebase/".length);
        const context = await getCodebaseContext(organizationId, repo);
        if (!context) {
          return NextResponse.json({ error: `Repository not found for: ${repo}` }, { status: 404 });
        }
        return NextResponse.json(context);
      } else if (uri.startsWith("context://incidents/")) {
        const service = uri.slice("context://incidents/".length);
        const context = await getIncidentContext(organizationId, service);
        return NextResponse.json(context);
      } else {
        return NextResponse.json({ error: `Unsupported resource URI: ${uri}` }, { status: 400 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ---------------------------------------------------------------------------
  // Protocol Type D: Custom Simplified Prompt Query
  // ---------------------------------------------------------------------------
  if ("prompt" in body) {
    const name = body.prompt;
    if (typeof name !== "string") {
      return NextResponse.json({ error: "prompt field must be a string" }, { status: 400 });
    }

    try {
      const prompt = await getPrompt(name);
      if (!prompt) {
        return NextResponse.json({ error: `Prompt not found: ${name}` }, { status: 404 });
      }
      return NextResponse.json(prompt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ---------------------------------------------------------------------------
  // Protocol Type C: Custom Simplified Tool Call (Original Format)
  // ---------------------------------------------------------------------------
  if ("tool" in body && "input" in body) {
    const { tool, input } = body as { tool: string; input: unknown };

    try {
      switch (tool) {
        case "score_change": {
          const parsed = ScoreChangeInputSchema.safeParse(input);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid input", details: parsed.error.flatten() },
              { status: 400 }
            );
          }
          if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
            return NextResponse.json(
              { error: "Forbidden: Repository does not belong to your organization" },
              { status: 403 }
            );
          }
          const result = await scoreChange(parsed.data);
          return NextResponse.json(result);
        }

        case "get_ownership": {
          const parsed = GetOwnershipInputSchema.safeParse(input);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid input", details: parsed.error.flatten() },
              { status: 400 }
            );
          }
          if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
            return NextResponse.json(
              { error: "Forbidden: Repository does not belong to your organization" },
              { status: 403 }
            );
          }
          const result = await getOwnership(parsed.data);
          return NextResponse.json(result);
        }

        case "get_constraints": {
          const parsed = GetConstraintsInputSchema.safeParse(input);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid input", details: parsed.error.flatten() },
              { status: 400 }
            );
          }
          if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
            return NextResponse.json(
              { error: "Forbidden: Repository does not belong to your organization" },
              { status: 403 }
            );
          }
          const result = await getConstraints(parsed.data);
          return NextResponse.json(result);
        }

        case "get_implicit_ownership": {
          const parsed = GetImplicitOwnershipInputSchema.safeParse(input);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid input", details: parsed.error.flatten() },
              { status: 400 }
            );
          }
          if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
            return NextResponse.json(
              { error: "Forbidden: Repository does not belong to your organization" },
              { status: 403 }
            );
          }
          const result = await getImplicitOwnership(parsed.data);
          return NextResponse.json(result);
        }

        case "get_blast_radius": {
          const parsed = GetBlastRadiusInputSchema.safeParse(input);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "Invalid input", details: parsed.error.flatten() },
              { status: 400 }
            );
          }
          if (!(await verifyRepositoryOwnership(parsed.data.repositoryId, organizationId))) {
            return NextResponse.json(
              { error: "Forbidden: Repository does not belong to your organization" },
              { status: 403 }
            );
          }
          const result = await getBlastRadius(parsed.data, organizationId);
          return NextResponse.json(result);
        }

        default:
          return NextResponse.json(
            { error: `Unknown tool: ${tool}. Valid tools: score_change, get_ownership, get_constraints, get_implicit_ownership, get_blast_radius` },
            { status: 400 }
          );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error(`[MCP] Tool '${tool}' failed:`, err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Body must contain standard JSON-RPC 2.0 fields or simplified tool/resource fields" },
    { status: 400 }
  );
}

// Reject non-POST methods cleanly
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
