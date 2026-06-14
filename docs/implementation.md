# IMPLEMENTATION_PLAN.md

# ContextHub AI

## Official Product Implementation Plan v1.0

---

# Executive Summary

ContextHub AI is building the context infrastructure layer for AI coding agents.

Today's coding agents understand code.

They do not understand:

* Ownership
* Organizational constraints
* Deployment restrictions
* Incident history
* Business criticality
* Operational risk

ContextHub AI provides that missing context.

The initial wedge is AI Change Risk Scoring.

The long-term vision is becoming the default context layer between AI agents and enterprise systems.

---

# Product Strategy

## Vision

Become the source of truth for organizational engineering context.

## Mission

Help AI coding agents make safer, more informed decisions.

## Initial Wedge

AI-generated Pull Request Risk Scoring.

## Long-Term Evolution

```text
Risk Scoring
→ Ownership Intelligence
→ Context Retrieval
→ Engineering Brain
→ Company Brain
→ Context Operating System
```

---

# Success Criteria

The product is successful when:

1. A GitHub App can be installed in under 10 minutes.
2. Every Pull Request receives a risk assessment.
3. Engineers trust the assessment.
4. Teams use risk signals before merging code.
5. AI agents begin requesting context through MCP.

---

# PHASE 0

## Foundation

### Timeline

Week 1

### Goal

Establish production-ready engineering foundation.

### Deliverables

* Next.js 15 application
* TypeScript setup
* TailwindCSS
* shadcn/ui
* Supabase project
* Authentication
* CI/CD
* Monitoring
* Analytics

### Infrastructure Setup

#### Frontend

* Next.js
* Tailwind
* shadcn/ui

#### Backend

* Next.js Route Handlers
* Server Actions

#### Database

* Supabase PostgreSQL

#### Deployment

* Vercel

#### Analytics

* PostHog

#### Monitoring

* Sentry

### Exit Criteria

User can:

* Sign in
* Create organization
* Access dashboard

---

# PHASE 1

## GitHub Integration Layer

### Timeline

Week 2

### Goal

Collect repository and pull request data.

### Deliverables

#### GitHub App

Capabilities:

* Installation Flow
* Repository Access
* Webhooks
* Pull Request Events

#### Event Processing

Capture:

* Pull Requests
* Commits
* Review Requests
* Review Events
* Repository Metadata

#### Data Storage

Store:

* Repository Information
* Pull Request Metadata
* Changed Files
* Commit Information
* Author Information

### Exit Criteria

Opening a Pull Request results in data being stored successfully.

---

# PHASE 2

## Context Collection Engine

### Timeline

Week 3

### Goal

Build the foundation of organizational context.

### Deliverables

#### CODEOWNERS Parser

Extract:

* File ownership
* Team ownership
* Reviewer mappings

#### Sensitive Path Registry

Support:

* Payments
* Authentication
* Infrastructure
* PII
* Compliance-sensitive modules

#### Deployment Constraint Registry

Support:

* Freeze Windows
* Restricted Deployments
* Compliance Restrictions

#### Incident Registry

Store:

* Historical incidents
* Impact level
* Affected services

### Exit Criteria

ContextHub can answer:

> Who owns this code?

and

> Is this code sensitive?

---

# PHASE 3

## Risk Engine v1

### Timeline

Week 4

### Goal

Generate deterministic risk scores.

### Core Principle

Risk scores must NOT depend on LLM output.

### Risk Factors

#### Ownership Risk

Examples:

* Non-owner modifying critical files
* Missing reviewer coverage

#### Change Scope Risk

Examples:

* Large Pull Requests
* Multiple service modifications

#### Critical Area Risk

Examples:

* Payments
* Authentication
* Infrastructure

#### Operational Risk

Examples:

* Deployment freeze active
* Recent incidents

### Output

Generate:

* Risk Score (1-10)
* Risk Factors
* Suggested Reviewers

### Exit Criteria

Every Pull Request receives a deterministic risk score.

---

# PHASE 4

## GitHub Delivery Layer

### Timeline

Week 5

### Goal

Deliver value inside existing workflows.

### Deliverables

#### GitHub Check

Displays:

* Risk Score
* Status

#### Pull Request Comment

Displays:

* Risk Explanation
* Ownership Information
* Recommendations

#### Reviewer Suggestions

Automatically recommend reviewers.

### Exit Criteria

Engineers receive value directly inside GitHub.

No dashboard required.

---

# PHASE 5

## AI Explanation Engine

### Timeline

Week 6

### Goal

Convert structured risk signals into understandable explanations.

### Model Responsibilities

Allowed:

* Summaries
* Explanations
* Recommendations

Forbidden:

* Risk scoring
* Compliance decisions
* Ownership decisions

### Example

Instead of:

Risk Score: 8

Generate:

Risk Score: 8

This change modifies a payment-processing module, affects a PCI-sensitive service, and bypasses normal ownership patterns. Similar services have experienced incidents recently.

### Exit Criteria

Risk assessments are understandable without reading raw factors.

---

# PHASE 6

## Context Dashboard

### Timeline

Week 7

### Goal

Expose collected organizational context.

### Pages

#### Repositories

Connected repositories.

#### Pull Requests

Recent assessments.

#### Ownership Map

Ownership coverage.

#### Incidents

Historical incidents.

#### Constraints

Deployment restrictions.

### Explicitly Excluded

Do NOT build:

* Advanced analytics
* Executive reporting
* Custom visualizations
* Org charts

### Exit Criteria

Customers can inspect collected context.

---

# PHASE 7

## Customer Validation

### Timeline

Weeks 8-12

### Goal

Validate demand.

### Target Customers

* Series B SaaS
* Series C SaaS
* 80-200 Engineers
* Active AI coding adoption

### Founder Responsibilities

* Weekly interviews
* Manual onboarding
* Risk tuning
* Support

### Success Metrics

* 5 pilot customers
* 1,000+ assessed PRs
* Weekly active usage
* At least one prevented incident

### Most Important Signal

Customer says:

> This caught something we would have missed.

---

# PHASE 8

## MCP Foundation

### Timeline

Months 3-4

### Goal

Allow AI agents to consume context directly.

### MCP Tools

#### score_change()

Returns:

* Risk score
* Risk factors
* Recommendations

#### get_ownership()

Returns:

* Owner
* Team
* Reviewer suggestions

#### get_constraints()

Returns:

* Deployment restrictions
* Compliance constraints
* Operational limitations

### Supported Agents

* Cursor
* Claude Code
* OpenHands
* Future MCP-compatible agents

### Exit Criteria

Agents can query ContextHub before proposing changes.

---

# PHASE 9

## Ownership Intelligence

### Timeline

Months 4-6

### Goal

Move beyond static CODEOWNERS.

### Deliverables

* Reviewer Graph
* Contributor Analysis
* Ownership Confidence
* Implicit Ownership Detection

### Example

Formal Owner:

Platform Team

Actual Owner:

Alice Johnson

Confidence:

92%

### Exit Criteria

Ownership quality exceeds GitHub-native ownership.

---

# PHASE 10

## Context Retrieval Layer

### Timeline

Months 6-9

### Goal

Build organizational memory.

### Deliverables

* Incident Search
* ADR Search
* Runbook Search
* Historical Context Search

### Retrieval Strategy

Hybrid Search:

* PostgreSQL Full Text Search
* pgvector Retrieval

### Exit Criteria

Agents can retrieve relevant historical context.

---

# PHASE 11

## Engineering Brain

### Timeline

Months 9-18

### Goal

Build organizational reasoning.

### Capabilities

* Blast Radius Prediction
* Dependency Awareness
* Incident Correlation
* Architecture Understanding
* Constraint Reasoning

### Outcome

ContextHub understands:

* Code
* Teams
* Systems
* Incidents
* Constraints

simultaneously.

---

# Database Schema Roadmap

## Core Tables

Required from Day 1

```text
organizations
users
repositories
github_installations
pull_requests
pull_request_files
risk_assessments
ownership_rules
incidents
deployment_constraints
agent_executions
mcp_requests
```

---

# PMF Gate

Do not add major infrastructure before achieving:

* 10+ paying customers
* $10k+ MRR
* Strong retention
* Weekly active teams

---

# Explicitly Forbidden Before PMF

Do NOT build:

* Neo4j
* Graph Databases
* Kubernetes
* Kafka
* Microservices
* LangGraph
* CrewAI
* AutoGen
* Multi-Agent Systems
* Event Sourcing
* CQRS
* Snowflake
* ElasticSearch

Without explicit architectural approval.

---

# North Star

Every feature must answer:

> Does this help AI coding agents understand organizational reality?

If the answer is no, do not build it.

---

# Year One Goal

When an AI coding agent is about to modify code, it should automatically ask:

> What should I know before touching this?

ContextHub AI should provide the answer.

That is the company being built.
