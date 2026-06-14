# ENGINEERING-STANDARDS.md

# ContextHub AI

## Official Engineering Standards v1.0

---

# Purpose

These standards are mandatory.

All engineers and AI coding agents must follow them.

If generated code violates these standards, the standards win.

---

# General Rules

## Rule 1

Always prefer simplicity.

---

## Rule 2

Do not optimize for hypothetical scale.

---

## Rule 3

Every feature must solve a real product problem.

---

# TypeScript

Mandatory:

strict: true

Never use:

any

unknown-as-any

ts-ignore

---

# Validation

All external input must be validated.

Use:

Zod

Required for:

* API requests
* Webhooks
* Forms
* MCP requests

---

# Database Access

Never access Supabase directly from UI.

Always:

UI

↓

Server

↓

Service

↓

Repository

↓

Database

---

# Business Logic

Forbidden:

Business logic in:

* React Components
* API Routes
* Server Actions

Required:

Business logic inside Domain Services.

---

# Folder Structure

```text
src/

app/

domains/

github/
risk/
ownership/
incidents/
constraints/
mcp/

components/

lib/
```

No alternative structures.

---

# React

Use:

Server Components by default.

Use Client Components only when required.

---

# State Management

Server State:

TanStack Query

Local State:

useState

No Redux.

No Zustand.

Before PMF.

---

# Styling

Allowed:

TailwindCSS

shadcn/ui

Forbidden:

Material UI

Ant Design

Chakra UI

---

# API Design

Rules:

* REST First
* Predictable Naming
* Typed Responses

Example:

GET /api/repositories

POST /api/risk/assess

---

# Error Handling

Every API endpoint must:

* Return typed errors
* Log failures
* Never expose internal details

---

# Logging

Use structured logging.

Every log must contain:

timestamp

request_id

organization_id

service

---

# Testing

Required:

Domain Services

Repositories

Risk Engine

Ownership Engine

---

# Coverage Targets

Critical Services:

90%

Everything Else:

80%

---

# Security

Never trust:

GitHub Webhooks

User Input

MCP Requests

Always validate.

---

# LLM Rules

LLMs may:

* Explain
* Summarize
* Recommend

LLMs may NOT:

* Determine Risk Score
* Determine Ownership
* Override Constraints

---

# Risk Engine Rules

Risk Engine must remain deterministic.

All scores must be reproducible.

Identical inputs must generate identical scores.

---

# Dependencies

Before adding a dependency ask:

1. Can native TypeScript solve this?

2. Can existing dependency solve this?

3. Does this reduce complexity?

If any answer is no:

Do not install.

---

# Architecture Rules

No:

Microservices

Kafka

Event Bus

CQRS

Event Sourcing

Neo4j

Kubernetes

Before PMF.

---

# Pull Request Rules

Every PR must:

* Pass type checking
* Pass linting
* Pass tests
* Include reasoning

---

# AI Agent Rules

Cursor / Claude Code must:

Read:

* prd.md
* architecture.md
* database.md
* implementation.md
* workflow.md
* engineering-standards.md

Before generating code.

Agents may not invent architecture.

Agents may not invent tables.

Agents may not add libraries outside techstack.md.

---

# Golden Rule

Optimize for:

Clarity

Maintainability

Correctness

Speed of iteration

Not complexity.

ContextHub AI wins through product insight,
not infrastructure complexity.
