Task:
Set up PostgreSQL schema.

Goal:
Implement exactly the tables defined in database.md.

Do not add columns.
Do not add indexes.
Do not add constraints.

Unless explicitly specified.

Requirements:

- Drizzle ORM
- PostgreSQL
- migrations

Implement:

organizations
users
repositories
github_installations
pull_requests
pull_request_files
ownership_rules
deployment_constraints
incidents
incident_services
risk_assessments
risk_factors
mcp_requests
mcp_responses

Do not create additional tables.

Validation:

Migration executes successfully.