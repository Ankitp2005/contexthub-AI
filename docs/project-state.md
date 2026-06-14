# 10-project-state.md

# ContextHub AI Project State

Version: Live Document

Status: Active

---

# Current Phase

Phase 1

Foundation

---

# Current Sprint

Sprint 1

Repository Foundation

---

# Current Task

None

---

# Completed Tasks

## Repository Audit and Review

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Performed full repository review against prd.md, architecture.md, database.md, workflow.md, and engineering-standards.md.
- Identified and categorized architecture drift, unnecessary dependencies, missing tests, duplicate logic, and security issues by severity levels (Critical, High, Medium, Low).

---

## Outstanding Features Implementation (Audit Resolutions)

Status: ✅ Complete

Completed: 2026-06-13

Deliverables:
- Realigned Next.js Clerk middleware by migrating authentication protection from `src/proxy.ts` to `src/middleware.ts`, adding public route bypass rules for `/api/mcp` and webhooks.
- Implemented GitHub Check Runs (Phase 4) by mapping risk levels to Check conclusions and sending them to GitHub check-runs API inside the risk assessment pipeline.
- Implemented MCP Resources (Phase 8) by creating codebase and incident context service retrievers and exposing them via JSON-RPC 2.0 interface on the `/api/mcp` route.
- Verified all unit and integration tests are passing successfully.

---

## Security Audit Resolutions

Status: ✅ Complete

Completed: 2026-06-14

Deliverables:
- Implemented Zod schema validations for Dashboard POST endpoints `/api/constraints` and `/api/incidents` to prevent parameter injection.
- Transitioned the MCP endpoint to multi-tenant organization-scoped Bearer tokens, checking repository ownership boundaries and scoping queries to the authenticated tenant.
- Applied IP-based sliding-window rate limiting on the public webhooks and MCP endpoints, throttling requests above 60/min.
- Enabled and configured PostgreSQL Row Level Security (RLS) policies on all 14 tables via custom migrations for complete database tenant isolation.
- Patched IP spoofing and malformed IP address key vulnerabilities in the sliding-window rate-limiting middleware.
- Added verification in the GitHub callback handler to check repository installation ownership and prevent cross-tenant hijacking of existing installations.
- Implemented timing-safe API key comparison for global `MCP_API_KEY` token check using SHA-256 digests.
- Added unit test suite covering key comparison and IP resolution helpers, verifying all 76 tests pass successfully.

---

## Prompt 019 — get_constraints

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Created repository function `getConstraintsForOrganization(organizationId)` in `src/domains/constraints/repositories/index.ts` to retrieve constraints from DB.
- Created `getApplicableConstraints(repositoryId, scope)` service in `src/domains/constraints/services/retrieval.ts` along with pure `isConstraintApplicable` helper.
- Exported constraints services and types from `src/domains/constraints/services/index.ts` barrel.
- Refactored `getConstraints` in `src/domains/mcp/services/tools.ts` to delegate to `getApplicableConstraints`, removing direct database query and scope filtering logic from the MCP layer.
- Refactored `scoreChange` in `src/domains/mcp/services/tools.ts` to use `getConstraintsForOrganization`, removing direct select query on `deployment_constraints` from the MCP layer.
- Added comprehensive unit tests in `src/domains/constraints/services/__tests__/retrieval.test.ts` (4/4 passing).
- Run full test suite: ✅ 52/52 tests passing.

Validation: Tested under multiple scope configurations, wildcards (*), and verified that applicable constraints are correctly returned.

---

## Prompt 018 — get_ownership

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Created repository function `getOwnershipRulesForRepository(repositoryId)` in `src/domains/ownership/repositories/index.ts` to fetch rules.
- Created `getFileOwnership(repositoryId, filePath)` service in `src/domains/ownership/services/retrieval.ts` with pure helper logic for path matching and CODEOWNERS precedence evaluation.
- Exported new retrieval services from `src/domains/ownership/services/index.ts` barrel.
- Refactored `getOwnership` in `src/domains/mcp/services/tools.ts` to delegate to `getFileOwnership`, removing direct database query and matching logic from the MCP layer.
- Added comprehensive unit tests in `src/domains/ownership/services/__tests__/retrieval.test.ts` (8/8 passing).
- Run full test suite: ✅ 48/48 tests passing.

Validation: Tested under multiple patterns, wildcard (*), specific paths, directory structures, and verified that the last matching pattern takes precedence (precedence order matching).

---

## Prompt 017 — score_change

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Refactored src/domains/mcp/services/tools.ts to extract three pure exported helpers:
  - countChangedLines(diff): counts +/- lines in unified diff
  - detectOwnershipMismatch(files, ownershipRows): matches CODEOWNERS patterns (strips leading slash)
  - buildRiskInputFromContext(ctx): canonical RiskInput constructor — no duplicated logic
- scoreChange() delegates scoring exclusively to scoreRisk(buildRiskInputFromContext(ctx))
- Updated src/domains/mcp/services/index.ts to export all three pure helpers
- Fixed CODEOWNERS pattern matching bug: leading-slash strip ensures /src/payments matches src/payments/checkout.ts
- Created src/domains/mcp/services/__tests__/score-change.test.ts (19/19 passing):
  - 4 countChangedLines tests
  - 5 detectOwnershipMismatch tests
  - 5 buildRiskInputFromContext tests
  - 5 SAME-SCORE proofs: scoreRisk(buildRiskInputFromContext(ctx)) === direct scoreRisk call
- TypeScript check: ✅ passes (0 errors)
- Full suite: 40/40 tests pass

Validation: 5 dedicated 'same score as dashboard' tests prove the tool uses
identical scoring logic to any other caller of scoreRisk().

---

## Prompt 016 — MCP Foundation

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Created src/domains/mcp/types/index.ts — ScoreChangeResult, GetOwnershipResult, GetConstraintsResult DTOs
- Created src/domains/mcp/schemas/index.ts — Zod schemas for all 3 tool inputs
- Created src/domains/mcp/services/tools.ts — score_change, get_ownership, get_constraints
  - score_change: delegates to scoreRisk() + explainRiskAssessment(), loads ownership/constraints from DB
  - get_ownership: queries ownership_rules table, returns first matching CODEOWNERS rule
  - get_constraints: queries deployment_constraints for org, filters by scope
- Updated src/domains/mcp/services/index.ts — barrel exports for all tools, types, and schemas
- Created src/app/api/mcp/route.ts — POST /api/mcp endpoint with Bearer auth, Zod validation, tool routing
- Added MCP_API_KEY to .env.example
- Added 11 unit tests in src/domains/mcp/services/__tests__/tools.test.ts (11/11 passing)
- TypeScript check: ✅ passes (0 errors)
- All 3 tools callable via POST /api/mcp

---

## Prompt 015 — Slack Alerts

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Created src/domains/risk/services/slack.ts containing:
  - sendSlackAlert() checking score >= threshold before sending
  - Default threshold of 7 (overridable via SLACK_RISK_THRESHOLD env var)
  - Graceful no-op when SLACK_WEBHOOK_URL is not configured
  - Structured Slack message formatting with repo, PR link, score, level, and factor list
  - Native fetch POST to Slack Incoming Webhook URL — no new dependencies
- Exported sendSlackAlert and SendSlackAlertInput from src/domains/risk/services/index.ts
- Added SLACK_WEBHOOK_URL and SLACK_RISK_THRESHOLD to .env.example
- Added complete unit test suite in src/domains/risk/services/__tests__/slack.test.ts (5/5 passing)
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 014 — GitHub PR Comment Publisher

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- Created src/domains/github/services/pr-comment.ts containing:
  - getRecommendationForLevel mapping risk level to deterministic recommendations
  - formatRiskComment formatting Markdown assessment summaries
  - publishRiskComment creating PR comments using native fetch and installation tokens
- Exported new services from src/domains/github/services/index.ts barrel file
- Resolved potential ESM namespace mocking and circular dependencies with dynamic imports
- Added complete unit test suite in src/domains/github/services/__tests__/pr-comment.test.ts (5/5 passing)
- Validated TypeScript: type checking passes with zero errors

---

## Prompt 001 — Repository Initialization

Status: ✅ Complete

Completed: 2026-06-05

Deliverables:
- Next.js 16.2.7 initialized with App Router and src/ directory
- TypeScript strict mode enabled
- Tailwind CSS v4 configured
- ESLint configured (eslint-config-next)
- Prettier configured (.prettierrc, .prettierignore)
- shadcn/ui initialized (base-nova style, CSS variables, RSC)
- Domain directory structure created (github, risk, ownership, incidents, constraints, mcp)
- src/components/ and src/lib/ directories created
- .env.example created
- Build validated: ✅ passes
- TypeScript check: ✅ passes
- ESLint: ✅ passes

---

## Prompt 002 — Database Initialization

Status: ✅ Complete

Completed: 2026-06-05

Deliverables:
- drizzle-orm and postgres installed as dependencies
- drizzle-kit installed as dev dependency
- src/lib/db/schema.ts created with all 14 tables from database.md
- src/lib/db/index.ts created (Drizzle client via postgres.js)
- drizzle.config.ts created at project root
- db:generate and db:migrate scripts added to package.json
- DATABASE_URL added to .env.example
- Migration generated: src/lib/db/migrations/0000_famous_roulette.sql
- Migration validated: ✅ drizzle-kit generate passes (14 tables confirmed)
- Migration applied: ✅ migrations applied successfully to Supabase

Tables implemented:
- organizations, users, repositories, github_installations
- pull_requests, pull_request_files, ownership_rules
- deployment_constraints, incidents, incident_services
- risk_assessments, risk_factors, mcp_requests, mcp_responses

---

## Prompt 003 — Authentication

Status: ✅ Complete

Completed: 2026-06-05

Deliverables:
- @clerk/nextjs installed
- src/middleware.ts created (clerkMiddleware, protected routes)
- src/app/layout.tsx updated with ClerkProvider
- src/app/sign-in/[[...sign-in]]/page.tsx created
- src/app/sign-up/[[...sign-up]]/page.tsx created
- src/app/dashboard/page.tsx created (protected route)
- Clerk env vars added to .env.example and .env.local
- Public routes: /, /sign-in, /sign-up
- Protected routes: all others (redirects to /sign-in)

---

## Prompt 004 — Domain Scaffolding

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- 24 placeholder index.ts files created across 6 domains × 4 subdirectories
- domains/github: services/, repositories/, schemas/, types/
- domains/risk: services/, repositories/, schemas/, types/
- domains/ownership: services/, repositories/, schemas/, types/
- domains/incidents: services/, repositories/, schemas/, types/
- domains/constraints: services/, repositories/, schemas/, types/
- domains/mcp: services/, repositories/, schemas/, types/
- tsconfig.json: drizzle.config.ts excluded from type-check
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 005 — GitHub App Foundation

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/github/types/index.ts — GitHub API types
- src/domains/github/schemas/index.ts — installation_id validation
- src/domains/github/services/index.ts — JWT (node:crypto), token exchange, repo listing (fetch)
- src/domains/github/repositories/index.ts — org/installation/repo DB operations
- src/app/api/github/callback/route.ts — installation callback route
- src/app/dashboard/page.tsx — Connect GitHub button + repository list
- NEXT_PUBLIC_GITHUB_APP_SLUG added to .env.example
- TypeScript check: ✅ passes (0 errors)
- No new dependencies (node:crypto + fetch are native)

---

## Prompt 006 — Webhook Infrastructure

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/github/services/webhooks.ts — webhook signature verification via node:crypto
- src/app/api/github/webhook/route.ts — event routing and signature check
- Verified using native NextRequest.text() to properly check HMACS
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 007 — Repository Sync

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/github/types/index.ts — Webhook payload types added
- src/domains/github/repositories/index.ts — Deletion methods added
- src/domains/github/services/sync.ts — Sync service to handle repo addition/removal
- src/app/api/github/webhook/route.ts — Added event routing for installation_repositories
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 008 — CODEOWNERS Parser

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/ownership/types/index.ts — Added types for Codeowners rules and ownership mapping.
- src/domains/ownership/services/parser.ts — Wrote `parseCodeownersFile` function to strictly process rules per instructions.
- src/domains/ownership/repositories/index.ts — Added `syncOwnershipRules` with `clearOwnershipRulesForRepository` and `storeOwnershipRules`.
- Validation: Verified that rules handle users, teams, and email formats.
- TypeScript check: ✅ passes (0 errors).

---

## Prompt 009 — Pull Request Ingestion

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/github/types/index.ts — Added GitHubPullRequestWebhookPayload and GitHubPRFile types
- src/domains/github/repositories/pull-requests.ts — [NEW] upsertPullRequest, storePullRequestFiles, clearPullRequestFiles
- src/domains/github/services/pull-requests.ts — [NEW] GitHub API call for PR file listing
- src/domains/github/services/pr-ingestion.ts — [NEW] handlePullRequestEvent orchestrates upsert and file sync
- src/app/api/github/webhook/route.ts — pull_request event now routed to handlePullRequestEvent
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 010 — Risk Engine V1

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/risk/types/index.ts — RiskInput, RiskFactor, RiskLevel, RiskAssessmentResult types
- src/domains/risk/schemas/index.ts — Zod RiskInputSchema (validates all 5 allowed inputs)
- src/domains/risk/services/engine.ts — scoreRisk() pure deterministic function (no AI/ML)
- src/domains/risk/services/index.ts — barrel re-export
- TypeScript check: ✅ passes (0 errors)

Score formula (from risk-engine.md):
- Base: 1
- OwnershipMismatch: +3
- CriticalService: +4
- DeploymentFreezeViolation: +3
- RecentIncident: +2
- LargeChangeSet (>25 files): +1
- ExcessiveLOC (>500 lines): +1
- MultipleCriticalServices (>=2): +2
- Override: CriticalService + DeploymentFreeze → minimum 9
- Clamped to [1, 10]

---

## Prompt 011 — Risk Factors

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/risk/services/engine.ts — generateRiskFactors(input): RiskFactor[] extracted as named pure function
- scoreRisk() now delegates factor collection entirely to generateRiskFactors()
- Factor shape: { name: string, weight: number, reason: string }
- Sum of factor weights + BASE (1) always equals pre-override raw score
- Factors provably map directly to score — no hidden weight logic
- src/domains/risk/services/index.ts — generateRiskFactors added to barrel export
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 012 — Risk Assessment Persistence

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/risk/repositories/index.ts — storeRiskAssessment(), findRiskAssessmentByPullRequestId(), findRiskAssessmentById()
- storeRiskAssessment() inserts 1 risk_assessments row then N risk_factors rows (one per triggered factor)
- Column mapping: factor.name → factor_type | factor.weight → weight | factor.reason → description
- reasoning column filled with structured string (Score/Level/Factors) — no AI, no prose
- Assessment retrieval returns assessment + child factors together
- TypeScript check: ✅ passes (0 errors)

---

## Prompt 013 — Explanation Engine

Status: ✅ Complete

Completed: 2026-06-06

Deliverables:
- src/domains/risk/services/explainer.ts — explainRiskAssessment(input): ExplainerOutput
- Input: score, level, and stored RiskFactor[] only — LLM cannot see raw PR data
- LLM prompt strictly forbids changing score, ownership, or constraints
- temperature=0 for consistent output from same factors
- Deterministic fallback: if OPENAI_API_KEY missing or call fails, returns template-based summary
- Uses native fetch — no new dependencies added
- .env.example updated with OPENAI_API_KEY
- src/domains/risk/services/index.ts — explainRiskAssessment + types exported
- TypeScript check: ✅ passes (0 errors)

---

# In Progress

None

---

# Blocked Tasks

None

---

# Upcoming Tasks

None

---

# Architectural Decisions

ADR-001

Modular Monolith

Status:
Accepted

---

ADR-002

Postgres Only

Status:
Accepted

---

ADR-003

Domain Driven Structure

Status:
Accepted

---

# Technical Debt

None

---

# Known Issues

None

---

# Release Readiness

Repository:
✅

Database:
✅

Authentication:
✅

GitHub:
✅

Risk Engine:
✅

MCP:
✅

Dashboard:
✅

Testing:
✅

---

# MVP Progress

100%

---

# Notes

After every completed prompt:

1. Move task from Upcoming → Completed
2. Update Current Task
3. Update MVP Progress
4. Record architectural decisions
5. Record technical debt

This document must always reflect the current state of the project.

It is the operational source of truth for development progress.