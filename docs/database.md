# DATABASE.md

# ContextHub AI

## Official Database Design v1.0

---

# Philosophy

Database design must optimize for:

* Simplicity
* Auditability
* Queryability
* Future MCP Expansion

PostgreSQL is the source of truth.

No secondary datastore allowed before PMF.

---

# Core Entities

Organization

↓

Repository

↓

Pull Request

↓

Risk Assessment

---

# organizations

Purpose:

Customer accounts.

Fields:

id

name

slug

plan

created_at

updated_at

---

# users

Purpose:

Authenticated users.

Fields:

id

organization_id

email

name

role

created_at

updated_at

---

# github_installations

Purpose:

GitHub App installations.

Fields:

id

organization_id

github_installation_id

account_name

created_at

---

# repositories

Purpose:

Connected repositories.

Fields:

id

organization_id

github_repo_id

name

full_name

default_branch

visibility

created_at

updated_at

---

# pull_requests

Purpose:

Tracked pull requests.

Fields:

id

repository_id

github_pr_id

number

title

author

state

created_at

updated_at

---

# pull_request_files

Purpose:

Changed files.

Fields:

id

pull_request_id

file_path

change_type

additions

deletions

created_at

---

# ownership_rules

Purpose:

CODEOWNERS mappings.

Fields:

id

repository_id

path_pattern

owner_type

owner_name

confidence

created_at

---

# deployment_constraints

Purpose:

Operational restrictions.

Fields:

id

organization_id

scope

constraint_type

description

severity

created_at

---

# incidents

Purpose:

Operational history.

Fields:

id

organization_id

title

severity

description

status

created_at

---

# incident_services

Purpose:

Map incidents to services.

Fields:

id

incident_id

service_name

created_at

---

# risk_assessments

Purpose:

Risk outputs.

Fields:

id

pull_request_id

risk_score

risk_level

reasoning

created_at

---

# risk_factors

Purpose:

Explain risk.

Fields:

id

risk_assessment_id

factor_type

weight

description

created_at

---

# mcp_requests

Purpose:

Agent activity.

Fields:

id

organization_id

agent_name

tool_name

request_payload

created_at

---

# mcp_responses

Purpose:

Agent responses.

Fields:

id

mcp_request_id

response_payload

created_at

---

# Relationships

Organization

hasMany

* Users
* Repositories
* Incidents
* Constraints

Repository

hasMany

* Pull Requests
* Ownership Rules

Pull Request

hasMany

* Files

Pull Request

hasOne

* Risk Assessment

Risk Assessment

hasMany

* Risk Factors

---

# Indexing

Required:

organizations.slug

repositories.github_repo_id

pull_requests.github_pr_id

ownership_rules.path_pattern

risk_assessments.risk_score

incidents.severity

---

# Future Tables

Add only when needed:

ownership_graph

architecture_nodes

context_embeddings

agent_feedback

review_history

deployment_events

---

# Explicitly Forbidden

Do NOT add:

* Graph Database
* Redis Cache
* ElasticSearch

Before PMF.

Postgres is sufficient.
