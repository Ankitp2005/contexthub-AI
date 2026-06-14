# ARCHITECTURE.md

# ContextHub AI

## Official System Architecture v1.0

---

# Philosophy

ContextHub AI is a Context Infrastructure Platform.

The architecture must optimize for:

* Simplicity
* Maintainability
* AI-Agent Development
* Fast Iteration
* Low Operational Complexity

The architecture must NOT optimize for:

* Premature scale
* Microservices
* Event-driven complexity
* Enterprise architecture theater

---

# Architectural Principles

## Principle 1

Monolith First.

Remain a modular monolith until:

* 10+ paying customers
* $10k+ MRR
* proven bottleneck

---

## Principle 2

Domain Driven Design.

Business capabilities own their logic.

Never organize code by framework.

Bad:

/api
/components
/utils

Good:

/risk
/ownership
/incidents
/github
/mcp

---

## Principle 3

Business Logic Lives In Services

Never place business logic in:

* API routes
* React components
* Server actions

All business logic belongs inside domain services.

---

# System Architecture

```text
Frontend (Next.js)

        ↓

API Layer

        ↓

Application Services

        ↓

Domain Services

        ↓

Repository Layer

        ↓

PostgreSQL
```

---

# Layers

## Layer 1

Frontend

Responsibilities:

* UI Rendering
* User Input
* Dashboard
* Settings

Never:

* Calculate Risk
* Determine Ownership
* Access Database Directly

---

## Layer 2

API Layer

Responsibilities:

* Authentication
* Request Validation
* Response Formatting

Never:

* Business Logic
* Database Logic

---

## Layer 3

Application Services

Responsibilities:

* Workflow Orchestration
* Use Cases

Examples:

CreateRiskAssessment

InstallGithubRepository

GenerateOwnershipMap

---

## Layer 4

Domain Services

Responsibilities:

* Core Business Logic

Examples:

RiskEngine

OwnershipEngine

IncidentEngine

ConstraintEngine

MCPContextEngine

---

## Layer 5

Repository Layer

Responsibilities:

* Data Access

Examples:

RiskRepository

IncidentRepository

OwnershipRepository

---

# Domain Architecture

```text
domains/

github/
risk/
ownership/
incidents/
constraints/
repositories/
organizations/
mcp/
agents/
```

---

# Core Services

## GitHub Service

Purpose:

Collect engineering signals.

Responsibilities:

* Webhooks
* Repository Sync
* PR Sync
* CODEOWNERS Parsing

---

## Risk Service

Purpose:

Risk Analysis.

Responsibilities:

* Risk Calculation
* Risk Factors
* Reviewer Suggestions

---

## Ownership Service

Purpose:

Code Ownership Intelligence.

Responsibilities:

* Ownership Mapping
* Ownership Confidence
* Reviewer Discovery

---

## Incident Service

Purpose:

Operational Memory.

Responsibilities:

* Incident Tracking
* Incident Correlation

---

## MCP Service

Purpose:

Agent Context Delivery.

Responsibilities:

* score_change()
* get_ownership()
* get_constraints()

---

# Event Flow

GitHub Event

↓

Webhook

↓

GitHub Service

↓

Context Collection

↓

Risk Service

↓

Database

↓

GitHub Response

---

# Future Architecture

When Context Retrieval launches:

```text
GitHub

↓

Context Collection

↓

Postgres

↓

pgvector

↓

Context Engine

↓

MCP Layer

↓

Agents
```

---

# Explicitly Forbidden

Do NOT add:

* Microservices
* Kafka
* Event Bus
* Neo4j
* CQRS
* Event Sourcing
* Service Mesh
* Kubernetes

Before PMF.

---

# North Star

Every component must answer:

Does this improve Context Collection,
Context Intelligence,
or Context Delivery?

If not, it does not belong in ContextHub.
