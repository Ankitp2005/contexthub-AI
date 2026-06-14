# TECHSTACK.md

# Context Layer for AI Coding Agents

# Official Engineering Standards v1.0

## Product Stage

Current Stage:

```text
Stage 1: Change Risk Scoring
```

Future Evolution:

```text
Change Risk Scoring
→ Agent Safety Layer
→ Context Layer
→ Engineering Brain
→ Company Brain
```

This stack is optimized for:

* Solo founder execution
* AI coding agents
* Fast iteration
* Enterprise readiness
* Low operational complexity
* Future scalability

---

# Engineering Principles

## Principle 1

Prefer simplicity over sophistication.

A simple system shipped today is worth more than a perfect system shipped six months later.

---

## Principle 2

Use managed services whenever possible.

Founder time is the bottleneck.

Not infrastructure cost.

---

## Principle 3

If PostgreSQL can solve it, use PostgreSQL.

Do not introduce new infrastructure unless it provides at least 10x value.

---

## Principle 4

Avoid architecture theater.

Customers pay for:

* Better risk detection
* Better context
* Fewer incidents

Customers do not pay for:

* Neo4j
* Microservices
* Agent orchestration frameworks

---

# Frontend

## Framework

Next.js 15+

## Language

TypeScript

## UI Components

shadcn/ui

## Styling

Tailwind CSS

## Forms

React Hook Form

## Validation

Zod

## State Management

TanStack Query

Avoid Redux.

---

# Backend

## Architecture

Next.js Full Stack

Use Route Handlers and Server Actions initially.

Do NOT create a separate backend service until required.

---

## Language

TypeScript

---

## API Style

REST

Internal APIs only.

No GraphQL.

---

# Database

## Primary Database

Supabase PostgreSQL

## Extensions

Enable:

* pgvector
* pg_trgm

from Day 1.

---

## Database Rules

PostgreSQL is the source of truth.

Do not introduce:

* MongoDB
* Neo4j
* Cassandra

before PMF.

---

# Authentication

## Provider

Supabase Auth

Supported:

* Email Login
* GitHub Login

Future:

* Google
* SAML SSO

---

# Storage

## Provider

Supabase Storage

Used For:

* PR snapshots
* Audit logs
* Attachments
* Incident documents

---

# Background Jobs

## Provider

Inngest

Uses:

* GitHub webhook processing
* Risk calculations
* Slack notifications
* Scheduled scans

Avoid custom queue systems.

Avoid BullMQ until required.

---

# Git Integrations

## Phase 1

GitHub only

Required:

* GitHub App
* Webhooks
* Pull Request Events

Ignore GitLab and Bitbucket initially.

---

# AI Layer

## SDK

Vercel AI SDK

This is the official abstraction layer.

Never couple business logic directly to one model provider.

---

## Models

Primary:

* GPT-5

Secondary:

* Claude Sonnet

Fast Tasks:

* GPT-5 Mini class models

---

## Model Usage Rules

AI generates:

* Explanations
* Summaries
* Recommendations

AI DOES NOT generate:

* Risk scores
* Compliance decisions
* Ownership decisions

Those must remain deterministic.

---

# Risk Engine

## Implementation

Pure TypeScript

No AI involvement.

---

## Inputs

* CODEOWNERS
* File paths
* Sensitive directories
* PR size
* Historical incidents
* Deployment freezes
* Reviewer history

---

## Outputs

* Risk score
* Risk factors
* Recommended reviewers
* Human-readable explanation

---

# MCP Layer

MCP is a first-class component.

Treat it as strategic infrastructure.

---

## Official MCP Server

TypeScript

Official MCP SDK

---

## Initial Tools

score_change()

get_ownership()

get_constraints()

---

## Future Tools

get_incident_context()

predict_blast_radius()

get_architecture_context()

---

# Search

## Phase 1

PostgreSQL Full Text Search

Only.

---

## Phase 2

pgvector

Hybrid Retrieval:

* Keyword Search
* Vector Search

---

## Rules

No Pinecone.

No Weaviate.

No Qdrant.

Before PMF:

Postgres is enough.

---

# Analytics

## Provider

PostHog

Track:

* Risk score generation
* PR volume
* User activation
* MCP calls
* Feature adoption

---

# Monitoring

## Error Tracking

Sentry

## Observability

OpenTelemetry

---

# Feature Flags

## Provider

GrowthBook

Used for:

* Beta features
* A/B testing
* Gradual rollouts

---

# CI/CD

## Provider

GitHub Actions

Pipeline:

1. Lint
2. Type Check
3. Tests
4. Build
5. Deploy

---

# Deployment

## Frontend

Vercel Free Tier

---

## Database

Supabase Free Tier

---

## Background Jobs

Inngest Free Tier

---

## Analytics

PostHog Free Tier

---

## Monitoring

Sentry Free Tier

---

# Testing

## Unit Tests

Vitest

---

## Integration Tests

Vitest

---

## E2E Tests

Playwright

---

## Coverage Target

70%

Do not chase 100%.

---

# Data Model Foundations

Core Tables:

users

organizations

repositories

pull_requests

risk_assessments

incidents

ownership_rules

deployment_constraints

agent_executions

mcp_requests

These tables must exist from the beginning.

---

# Security

Required:

* HTTPS only
* Row Level Security
* Audit logging
* Encrypted secrets
* Least privilege access

Use Supabase RLS aggressively.

---

# Explicitly Forbidden Before PMF

Do NOT use:

* Neo4j

* TigerGraph

* JanusGraph

* Kafka

* Pulsar

* Kubernetes

* Microservices

* ElasticSearch

* Snowflake

* LangChain

* LangGraph

* CrewAI

* AutoGen

* Multi-Agent Frameworks

* Temporal

* CQRS

* Event Sourcing

* GraphQL

* Custom Vector Databases

Without explicit architectural approval.

---

# Definition of PMF

Product Market Fit is reached when:

* 10+ paying customers
* $10k+ MRR
* Weekly active usage
* Retention > 80%

Only after PMF may major infrastructure be reconsidered.

---

# Golden Rule

The moat is NOT the stack.

The moat is:

* Risk data
* Incident correlations
* Organizational context
* Agent behavior data

Infrastructure exists only to collect and leverage these assets.

Always optimize for customer value and speed of learning.
