# ADR.md

# Architecture Decision Records

Version: 1.0

Status: Active

---

# ADR-001

## Title

Modular Monolith Architecture

## Status

Accepted

## Date

2026-01-01

## Decision

ContextHub AI will be implemented as a Modular Monolith.

The system will be organized into business domains:

* organizations
* github
* ownership
* risk
* incidents
* constraints
* mcp
* notifications

Each domain owns:

* services
* repositories
* schemas
* types
* tests

Domains communicate through explicit service boundaries.

---

## Alternatives Considered

### Microservices

Rejected

### Event-Driven Architecture

Rejected

### Service-Oriented Architecture

Rejected

---

## Rationale

Current company stage:

* Single founder
* Pre-PMF
* Fast iteration required

Microservices would introduce:

* deployment complexity
* observability complexity
* infrastructure overhead
* operational burden

The expected workload of the MVP does not justify distributed architecture.

A modular monolith provides:

* faster development
* simpler deployment
* easier debugging
* lower infrastructure cost

---

## Consequences

### Positive

* faster iteration
* lower complexity
* easier local development
* lower hosting costs

### Negative

* future service extraction may be required
* stronger domain discipline required

---

## Revisit Criteria

Revisit when:

* more than 10 engineers
* multiple independent deployment cycles
* significant scaling bottlenecks

Until then:

Remain modular monolith.

---

# ADR-002

## Title

PostgreSQL As Primary Data Platform

## Status

Accepted

## Date

2026-01-01

## Decision

PostgreSQL is the sole persistence layer for the MVP.

Drizzle ORM is the exclusive database access layer.

No additional databases are permitted.

---

## Alternatives Considered

### Neo4j

Rejected

### ElasticSearch

Rejected

### Pinecone

Rejected

### Weaviate

Rejected

### Redis as Primary Store

Rejected

---

## Rationale

Current requirements:

* transactional storage
* ownership relationships
* risk assessments
* incidents
* repositories
* constraints

All requirements can be satisfied using PostgreSQL.

Additional databases would:

* increase complexity
* increase operational burden
* increase hosting costs

Premature specialization is prohibited.

---

## Consequences

### Positive

* simpler architecture
* simpler backups
* lower costs
* easier onboarding

### Negative

* some future graph queries may require optimization
* semantic search deferred

---

## Future Expansion Rules

Only add new infrastructure when:

1. A measurable bottleneck exists
2. PostgreSQL cannot reasonably solve it
3. A documented ADR approves the change

---

## Revisit Criteria

Possible additions:

### pgvector

Allowed after PMF.

Purpose:

Semantic search.

### Graph Layer

Allowed only when dependency traversal becomes a proven bottleneck.

### Dedicated Search Engine

Allowed only when PostgreSQL full-text search becomes insufficient.

Until then:

PostgreSQL remains the only database.

---

# ADR-003

## Title

Deterministic Risk Engine Before Machine Learning

## Status

Accepted

## Date

2026-01-01

## Decision

Risk scoring will be deterministic.

Machine learning is prohibited in Version 1.

---

## Rationale

The product's value depends on trust.

Engineers must understand:

* why a score exists
* which factors produced it
* how to challenge it

Deterministic scoring is:

* explainable
* testable
* auditable

Machine learning is not.

---

## Consequences

### Positive

* trust
* predictability
* easier debugging

### Negative

* lower sophistication initially

---

## Revisit Criteria

Only after:

* 50+ customers
* sufficient historical outcome data
* measurable improvement opportunity

---

# ADR-004

## Title

MCP As The Primary Agent Integration Protocol

## Status

Accepted

## Date

2026-01-01

## Decision

All agent integrations will be built through MCP.

MCP becomes the standard interface for:

* Cursor
* Claude Code
* OpenHands
* Future Agents

---

## Alternatives Considered

### Custom APIs Per Agent

Rejected

### SDK Per Agent

Rejected

---

## Rationale

MCP provides:

* standardization
* portability
* lower maintenance

One protocol.

Many agents.

---

## Consequences

### Positive

* easier integrations
* future-proof architecture

### Negative

* dependent on MCP ecosystem growth

---

## Revisit Criteria

Only if MCP adoption materially declines.

Otherwise MCP remains the integration strategy.
