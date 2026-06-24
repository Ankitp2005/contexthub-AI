import {
  pgTable,
  text,
  integer,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

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
