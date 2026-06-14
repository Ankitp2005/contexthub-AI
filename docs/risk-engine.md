# 07-risk-engine.md

# ContextHub AI Risk Engine Specification

Version: 1.0

Status: Authoritative Specification

Owner: ContextHub AI

---

# Purpose

The Risk Engine is the core decision-making system of ContextHub AI.

Its responsibility is to evaluate a proposed code change and determine the organizational risk associated with merging that change.

The Risk Engine does not evaluate code quality.

The Risk Engine does not evaluate correctness.

The Risk Engine evaluates organizational and operational risk.

Examples:

* Ownership violations
* Critical system modifications
* Deployment freeze violations
* Incident-prone areas
* Excessive blast radius

The Risk Engine must be deterministic.

Given identical inputs, the engine must always produce identical outputs.

Machine learning is explicitly prohibited in Version 1.

---

# Risk Philosophy

A change becomes risky when:

1. The change affects critical systems.
2. The change affects systems the author does not own.
3. The change touches historically unstable areas.
4. The change increases deployment risk.
5. The change expands blast radius.

Risk is cumulative.

Risk is not binary.

The objective is not to block changes.

The objective is to make organizational risk visible before merge.

---

# Risk Score Range

Minimum Score:

1

Maximum Score:

10

No score may exceed 10.

No score may fall below 1.

---

# Risk Levels

| Score | Level    |
| ----- | -------- |
| 1-3   | Low      |
| 4-6   | Medium   |
| 7-8   | High     |
| 9-10  | Critical |

---

# Risk Factors

## Ownership Mismatch

Definition:

PR modifies files owned by a team different from the author.

Weight:

+3

Examples:

* Payments team owns file
* Platform engineer modifies file

---

## Critical Service

Definition:

PR modifies a service marked critical.

Weight:

+4

Examples:

* Payments
* Authentication
* Billing
* Revenue pipelines

---

## Deployment Freeze Violation

Definition:

PR modifies code during an active freeze period.

Weight:

+3

Examples:

* Friday freeze
* Release freeze
* Compliance freeze

---

## Recent Incident Area

Definition:

PR modifies service associated with incident in previous 90 days.

Weight:

+2

---

## Large Change Set

Definition:

PR modifies more than 25 files.

Weight:

+1

---

## Excessive LOC Change

Definition:

PR changes more than 500 lines.

Weight:

+1

---

## Multiple Critical Services

Definition:

PR touches multiple critical systems.

Weight:

+2

---

## Sensitive Data Exposure Area

Definition:

PR touches PII, GDPR, HIPAA or PCI areas.

Weight:

+3

---

# Score Calculation

Initial Score:

1

Formula:

FinalScore =
1 +
OwnershipMismatch +
CriticalService +
DeploymentFreeze +
RecentIncident +
LargeChangeSet +
ExcessiveLOC +
MultipleCriticalServices +
SensitiveDataExposure

Cap:

Maximum 10

Minimum 1

---

# Normalization

If FinalScore > 10

Return:

10

If FinalScore < 1

Return:

1

---

# Critical Overrides

Regardless of calculated score:

If BOTH conditions are true:

* Critical Service
* Deployment Freeze

Minimum score becomes:

9

---

If BOTH conditions are true:

* Sensitive Data Area
* Ownership Mismatch

Minimum score becomes:

8

---

# Risk Assessment Output

Every assessment must contain:

* Score
* Risk Level
* Triggered Factors
* Factor Weights
* Generated Explanation

Example:

{
score: 8,
level: "HIGH",
factors: [
"OwnershipMismatch",
"CriticalService",
"RecentIncident"
]
}

---

# Prohibited Inputs

Version 1 must NOT use:

* LLM scoring
* ML scoring
* Sentiment analysis
* Semantic similarity
* Vector search

Only structured inputs are allowed.

---

# Future Version Roadmap

Version 2:

* Historical contributor analysis
* Dependency graph analysis

Version 3:

* Incident prediction model
* Statistical weighting

Version 4:

* Machine learning scoring

Machine learning may never replace deterministic scoring.

Machine learning may only enhance deterministic scoring.

---

# Engineering Rules

Risk scoring logic must exist in one location only.

MCP tools must reuse the same engine.

Dashboard must reuse the same engine.

GitHub comments must reuse the same engine.

No duplicate scoring implementations are permitted.

---

# Success Criteria

The Risk Engine succeeds when:

* Same input always produces same output
* Risk factors are explainable
* Engineers trust the score
* False negatives are minimized
* Explanations are understandable

This document is the authoritative source of truth for all risk calculations.
