# 08-mcp-spec.md

# ContextHub AI MCP Specification

Version: 1.0

Status: Authoritative Specification

Owner: ContextHub AI

---

# Purpose

ContextHub AI exposes organizational context to AI agents through MCP.

MCP is not a separate product.

MCP is a delivery mechanism for ContextHub intelligence.

The MCP server must never contain business logic.

Business logic remains inside domain services.

MCP acts as an interface layer.

---

# Supported Protocol

Model Context Protocol (MCP)

Current Version:

v1

---

# Architecture

AI Agent
    ↓
MCP Server
    ↓
Domain Services
    ↓
Postgres

The MCP layer must never access the database directly.

All requests must flow through domain services.

---

# Authentication

Authentication Method:

API Key

Headers:

Authorization: Bearer <token>

---

# Authorization

Every request belongs to:

- Organization
- Repository

Requests may never access data outside their organization.

Multi-tenant isolation is mandatory.

---

# MCP Tools

Version 1 exposes exactly 3 tools.

No additional tools permitted.

---

# Tool 1

score_change

Purpose:

Evaluate risk of proposed change.

---

Input Schema

{
  "repositoryId": "string",
  "files": ["string"],
  "diff": "string"
}

---

Output Schema

{
  "score": 8,
  "level": "HIGH",
  "factors": [
    {
      "name": "OwnershipMismatch",
      "weight": 3
    },
    {
      "name": "SensitiveDataExposure",
      "weight": 3
    }
  ],
  "summary": "string"
}

---

Risk Factors

| Factor                    | Weight | Trigger                                             |
|---------------------------|--------|-----------------------------------------------------|
| OwnershipMismatch         | +3     | PR author not in CODEOWNERS for touched paths       |
| CriticalService           | +4     | File path matches a critical-path keyword           |
| MultipleCriticalServices  | +2     | 2+ critical-path files changed                      |
| DeploymentFreeze          | +3     | Active deployment constraint                        |
| RecentIncident            | +2     | Touched service had a recent incident               |
| LargeChangeSet            | +1     | More than 25 files changed                          |
| ExcessiveLOC              | +1     | More than 500 lines changed                         |
| HighBlastRadius           | +1–3   | Direct downstream dependents (capped at 3)          |
| SensitiveDataExposure     | +3     | File path matches PII/GDPR/HIPAA/PCI keywords       |

---

Critical Override Rules

| Condition                                        | Floor |
|--------------------------------------------------|-------|
| CriticalService + DeploymentFreeze               | 9     |
| SensitiveDataExposure + OwnershipMismatch        | 8     |

---

Errors

401 Unauthorized

403 Forbidden

404 Repository Not Found

500 Internal Error

---

# Tool 2

get_ownership

Purpose:

Return ownership information.

---

Input Schema

{
  "repositoryId": "string",
  "filePath": "string"
}

---

Output Schema

{
  "ownerType": "TEAM",
  "ownerName": "Payments",
  "source": "CODEOWNERS"
}

---

# Tool 3

get_constraints

Purpose:

Return constraints relevant to scope.

---

Input Schema

{
  "repositoryId": "string",
  "scope": "string"
}

---

Output Schema

{
  "constraints": [
    {
      "type": "DEPLOYMENT_FREEZE",
      "description": "No Friday deployments"
    }
  ]
}

---

# MCP Resources

---

context://codebase/{repo}

Contains:

- teams
- ownership
- critical systems
- architecture metadata

---

context://incidents/{service}

Contains:

- recent incidents
- root causes
- incident count

---

# Versioning Rules

Breaking changes:

Require new major version.

Example:

v1 → v2

Non-breaking additions:

Allowed in minor releases.

Example:

v1.0 → v1.1

---

# Security Rules

Never expose:

- secrets
- environment variables
- tokens
- credentials

Never return:

- raw database records

Only return domain DTOs.

---

# Performance Requirements

Target latency:

<500ms

Maximum latency:

2 seconds

---

# Engineering Rules

MCP must never:

- calculate risk
- infer ownership
- perform business decisions

MCP only exposes existing services.

Business logic belongs to domains.

---

# Success Criteria

An AI agent should be able to:

1. Understand ownership
2. Understand constraints
3. Score changes

Without understanding internal architecture.

This document is the authoritative source of truth for MCP.