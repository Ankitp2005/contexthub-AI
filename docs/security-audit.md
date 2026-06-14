# ContextHub AI System Security Audit & Standards

This document establishes the official security architecture, standards, risk prevention rules, and audit status for the **ContextHub AI** platform. It aligns requirements from all governing system documents (`prd.md`, `architecture.md`, `database.md`, `engineerstandards.md`, `techstack.md`, and `mcp_spec.md`) into a single unified security framework.

---

## 🏛️ 1. Security Architecture & Threat Model

ContextHub AI operates as a **Modular Monolith** processing sensitive organizational context: repository files, commit diffs, CODEOWNERS structures, active deployment windows, and historical incident logs. 

The primary threat vectors include:
1.  **Context Exfiltration**: Unauthorized access to codebase metadata, diff contents, or ownership graphs.
2.  **Scoring Bypasses / Prompt Injections**: Attackers manipulating inputs or prompts to artificially lower risk assessments.
3.  **Cross-Tenant Leakage**: One organization query accessing codebase rules or constraints of another organization.
4.  **GitHub App Compromise**: Attackers hijacking the app's installation token to read private repositories.

---

## 🛡️ 2. Core Security Control Standards

### 2.1 Authentication Standards
*   **User Sessions (Web App)**:
    *   Handled exclusively by Clerk JWT Session tokens.
    *   All dashboard and CRUD API routes must route through the Next.js runtime middleware ([src/middleware.ts](file:///c:/Users/Ankit%20pandey/OneDrive/Desktop/contextHub/src/middleware.ts)) to enforce session protection.
*   **MCP API Endpoint**:
    *   Authenticates via Bearer Tokens passed in the HTTP `Authorization` header.
    *   API keys must be stored in secure environment configurations (`MCP_API_KEY`) and validated inside route handlers.

### 2.2 Authorization & Tenant Isolation
*   **Multi-Tenant Database Isolation**:
    *   *Rule*: Every entity in the database (Pull Requests, Repositories, Constraints, Incidents, Factors) must link to an `organization_id`.
    *   *Row-Level Security (RLS)*: Supabase PostgreSQL tables must have Row Level Security enabled. Policies must enforce that queries are scoped using `auth.jwt() -> organization_id` or equivalent session claims.
*   **API Tenant Isolation**:
    *   MCP API requests must map the API key to a specific tenant organization. Direct resource queries (e.g. `context://codebase/{repo}`) must verify that the requested repository belongs to the authenticated organization.

### 2.3 Webhook Security
*   **Signature Validation**:
    *   Every incoming event payload from GitHub must be verified against the configured `GITHUB_APP_WEBHOOK_SECRET` using SHA-256 HMAC.
    *   The comparison between the computed signature and the header signature must use a constant-time comparison library (e.g., Node's native `timingSafeEqual`) to prevent timing side-channel attacks.
*   **Replay Protection**:
    *   Verify request freshness and delivery IDs (`x-github-delivery`) to block webhook replay exploits.

### 2.4 Data Protection & Secret Management
*   **TLS in Transit**:
    *   All connections to APIs, webhooks, and the database must mandate HTTPS (TLS 1.3 preferred, TLS 1.2 minimum).
*   **Encryption at Rest**:
    *   Database disk encryption is mandatory. 
    *   Sensors, JWT secrets, and private keys (`GITHUB_APP_PRIVATE_KEY`) must be stored encrypted at rest or injected dynamically via secure server environment variables (never committed to git).

### 2.5 Input Sanitization & Validation
*   **Strict Zod Schemas**:
    *   *Mandate*: Every external entry point (forms, API routes, MCP endpoints, webhooks) must validate incoming payload parameters against a strict Zod schema.
    *   *Rule*: Strip unknown properties using Zod to block parameter pollution or unexpected payloads.

---

## 🎛️ 3. Vulnerability Mitigation Matrix

| Vulnerability Vector | Architectural Mitigation | Code Implementation |
| :--- | :--- | :--- |
| **SQL Injection** | Parameterized queries via Drizzle ORM | Raw SQL constructs are forbidden. All DB operations must use Drizzle query builder APIs. |
| **Cross-Site Scripting (XSS)** | React automatic string escaping | Next.js App Router enforces escaping by default. Avoid `dangerouslySetInnerHTML` with dynamic user content. |
| **Cross-Site Request Forgery (CSRF)** | Clerk Session Cookie Attributes | clerkMiddleware session tokens use `SameSite: Lax`/`Strict` cookie properties. |
| **API Denial of Service (DoS)** | Edge Rate Limiting | Middleware rate-limiting must be applied on public webhook and MCP API endpoints. |
| **Prompt Injection** | LLM Scoring Decoupling | The LLM is restricted strictly to generating *explanations*. It can never score, override, or decide risks. |

---

## 📋 4. Security Audit Compliance Checklist

Audit check of the current repository against these standards:

- `[x]` **Webhooks Verification**: Timing-safe HMAC validation implemented and validated.
- `[x]` **clerkMiddleware Setup**: Runtime route interception is correctly realigned to `src/middleware.ts` to protect Next.js routes.
- `[x]` **MCP Token Auth**: Bearer authorization headers validated securely.
- `[x]` **Dashboard APIs Validation**: `/api/constraints` and `/api/incidents` POST endpoints validate incoming body payloads using Zod schemas.
- `[x]` **MCP Key Scoping**: Multi-tenant database API keys linked to organization IDs implemented and enforced with repository ownership checks.
- `[x]` **PostgreSQL RLS Policies**: Row Level Security policies are enabled and configured on all 14 database tables using the `(auth.jwt() ->> 'sub')` claim for tenant isolation.
- `[x]` **API Rate Limiting**: Throttling/rate limiting implemented on public endpoints (`/api/mcp` and `/api/github/webhook`) using an IP-based sliding-window limiter.
