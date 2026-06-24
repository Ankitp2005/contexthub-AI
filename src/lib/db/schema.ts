import {
  pgTable,
  text,
  integer,
  timestamp,
  numeric,
  customType,
} from "drizzle-orm/pg-core";

// pgvector custom type for 1536-dimensional vectors
export const pgVector = customType<{ data: number[]; driverParam: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === "string") {
      return value.replace(/[\[\]]/g, "").split(",").map(Number);
    }
    return value as number[];
  },
});

// organizations
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  plan: text("plan").notNull(),
  mcp_api_key: text("mcp_api_key"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// github_installations
export const github_installations = pgTable("github_installations", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  github_installation_id: integer("github_installation_id").notNull(),
  account_name: text("account_name").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// repositories
export const repositories = pgTable("repositories", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  github_repo_id: integer("github_repo_id").notNull(),
  name: text("name").notNull(),
  full_name: text("full_name").notNull(),
  default_branch: text("default_branch").notNull(),
  visibility: text("visibility").notNull(),
  syncing_at: timestamp("syncing_at"),
  last_scanned_at: timestamp("last_scanned_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// pull_requests
export const pull_requests = pgTable("pull_requests", {
  id: text("id").primaryKey(),
  repository_id: text("repository_id").notNull(),
  github_pr_id: integer("github_pr_id").notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  state: text("state").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// pull_request_files
export const pull_request_files = pgTable("pull_request_files", {
  id: text("id").primaryKey(),
  pull_request_id: text("pull_request_id").notNull(),
  file_path: text("file_path").notNull(),
  change_type: text("change_type").notNull(),
  additions: integer("additions").notNull(),
  deletions: integer("deletions").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ownership_rules
export const ownership_rules = pgTable("ownership_rules", {
  id: text("id").primaryKey(),
  repository_id: text("repository_id").notNull(),
  path_pattern: text("path_pattern").notNull(),
  owner_type: text("owner_type").notNull(),
  owner_name: text("owner_name").notNull(),
  confidence: numeric("confidence").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// deployment_constraints
export const deployment_constraints = pgTable("deployment_constraints", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  scope: text("scope").notNull(),
  constraint_type: text("constraint_type").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// incidents
export const incidents = pgTable("incidents", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  description_vector: pgVector("description_vector"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// incident_services
export const incident_services = pgTable("incident_services", {
  id: text("id").primaryKey(),
  incident_id: text("incident_id").notNull(),
  service_name: text("service_name").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// risk_assessments
export const risk_assessments = pgTable("risk_assessments", {
  id: text("id").primaryKey(),
  pull_request_id: text("pull_request_id").notNull(),
  risk_score: numeric("risk_score").notNull(),
  risk_level: text("risk_level").notNull(),
  reasoning: text("reasoning").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// risk_factors
export const risk_factors = pgTable("risk_factors", {
  id: text("id").primaryKey(),
  risk_assessment_id: text("risk_assessment_id").notNull(),
  factor_type: text("factor_type").notNull(),
  weight: numeric("weight").notNull(),
  description: text("description").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// mcp_requests
export const mcp_requests = pgTable("mcp_requests", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  agent_name: text("agent_name").notNull(),
  tool_name: text("tool_name").notNull(),
  request_payload: text("request_payload").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// mcp_responses
export const mcp_responses = pgTable("mcp_responses", {
  id: text("id").primaryKey(),
  mcp_request_id: text("mcp_request_id").notNull(),
  response_payload: text("response_payload").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// commit_activity — stores per-file, per-author commit statistics (synced from GitHub)
export const commit_activity = pgTable("commit_activity", {
  id: text("id").primaryKey(),
  repository_id: text("repository_id").notNull(),
  file_path: text("file_path").notNull(),
  author_login: text("author_login").notNull(),
  commit_count: integer("commit_count").notNull().default(0),
  additions: integer("additions").notNull().default(0),
  deletions: integer("deletions").notNull().default(0),
  last_committed_at: timestamp("last_committed_at"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// implicit_ownership — stores computed confidence scores from the Ownership Confidence Engine
export const implicit_ownership = pgTable("implicit_ownership", {
  id: text("id").primaryKey(),
  repository_id: text("repository_id").notNull(),
  file_path: text("file_path").notNull(),
  owner_login: text("owner_login").notNull(),
  confidence_score: numeric("confidence_score").notNull(), // 0.00 – 100.00
  commit_count: integer("commit_count").notNull().default(0),
  total_commits: integer("total_commits").notNull().default(0),
  computed_at: timestamp("computed_at").notNull().defaultNow(),
});

// agent_executions
export const agent_executions = pgTable("agent_executions", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  agent_name: text("agent_name").notNull(),
  repository_id: text("repository_id").notNull(),
  task_description: text("task_description").notNull(),
  status: text("status").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
});

// dependency_graph — directed edges: repository → package it depends on
// Each row: source_repository_id depends on `package_name@package_version`
// `dependent_repository_id` is set when the package is also a known internal repo.
export const dependency_graph = pgTable("dependency_graph", {
  id: text("id").primaryKey(),
  organization_id: text("organization_id").notNull(),
  source_repository_id: text("source_repository_id").notNull(),
  package_name: text("package_name").notNull(),
  package_version: text("package_version").notNull(),
  /** npm | go | pip | cargo | unknown */
  ecosystem: text("ecosystem").notNull(),
  /** Set when the package is also a tracked repository in this org */
  dependent_repository_id: text("dependent_repository_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

