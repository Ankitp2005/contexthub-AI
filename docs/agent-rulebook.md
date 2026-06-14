# 09-agent-rulebook.md

# ContextHub AI Agent Rulebook

Version: 1.0

Status: Authoritative Specification

Owner: ContextHub AI

---

# Purpose

This document governs all AI coding agents.

Including:

- Cursor
- Claude Code
- Windsurf
- OpenHands
- Future Agents

This document overrides prompts.

---

# Reading Order

Before implementing ANY task:

Read:

1. prd.md
2. architecture.md
3. database.md
4. workflow.md
5. implementation.md
6. engineering-standards.md
7. risk-engine.md
8. mcp-spec.md
9. project-state.md

Only then begin work.

---

# Golden Rule

One Prompt

One Objective

One Deliverable

One Completion State

Stop.

Never continue automatically.

---

# Architecture Rules

Never create:

- new domains
- new architectures
- new service layers

Use existing architecture only.

---

# Database Rules

Never:

- create tables
- modify schema
- add columns

Unless explicitly requested.

Database.md is authoritative.

---

# Dependency Rules

Never install:

- libraries
- frameworks
- SDKs

unless listed in techstack.md.

---

# Domain Rules

Every file belongs to exactly one domain.

Allowed:

domains/risk/*
domains/github/*
domains/mcp/*

Forbidden:

services/*
business/*
core/*
misc/*
shared-business-logic/*

---

# Implementation Rules

Implement only requested functionality.

Never implement future phases.

Never implement roadmap items.

Never implement assumptions.

---

# Refactoring Rules

Refactoring is allowed only when:

- requested
- bug fix requires it

Otherwise:

no refactoring.

---

# Testing Rules

Every implementation requires:

- unit tests
- integration tests (where applicable)

No untested production code.

---

# Security Rules

Never:

- expose secrets
- log credentials
- bypass auth

Security beats convenience.

---

# MCP Rules

MCP must remain thin.

Business logic belongs to domains.

---

# Risk Engine Rules

Risk calculation exists once.

Only:

domains/risk

may calculate risk.

No duplicate implementations.

---

# Documentation Rules

After each task:

Update:

project-state.md

Required.

---

# Anti-Hallucination Rules

Never invent:

- APIs
- schemas
- workflows
- dependencies
- architecture

If specification missing:

STOP

Ask for clarification.

---

# Stopping Conditions

When task complete:

Return:

Summary

Files Modified

Files Created

Tests Added

Validation Results

Remaining Work

Stop.

Wait for next instruction.

---

# Forbidden Actions

Forbidden:

- architecture rewrites
- dependency changes
- schema changes
- silent refactors
- future feature implementation
- speculative coding

---

# Success Criteria

The agent succeeds when:

- task completed
- architecture preserved
- no hallucinations introduced

This document is the constitution of the codebase.