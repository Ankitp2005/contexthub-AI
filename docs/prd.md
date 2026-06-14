

Context Layer: Founder-Grade PRD


Section 1 — One Sentence
"Stripe for organizational context — the API layer that lets AI coding agents understand why code exists, who owns it, and what breaking it would cost."
The Stripe analogy holds: Stripe didn't build banks, it became the mandatory pipe between businesses and banks. This company becomes the mandatory pipe between AI agents and enterprise codebases. Payments still happen without Stripe; code still gets written without this — but neither is safe.

Section 2 — Why Now
2020: No one was using AI to write production code. The pain doesn't exist yet.
2022: GitHub Copilot launches. It's an autocomplete tool. The "unit of work" is a line or function. Context failures are embarrassing, not catastrophic. The coder is still in the loop for every decision.
2024: Claude, GPT-4, Cursor emerge as "agentic" code writers. But adoption is still mostly individual developers. Enterprises are experimenting cautiously. The volume of AI-generated code is still low enough that context failures are recoverable.
2026 — the exact inflection point:
Three things converged:

Agentic autonomy crossed a threshold. Cursor, Claude Code, Devin, and OpenHands now execute multi-step tasks spanning multiple files, services, and PRs — without a human reviewing every line. The loop is no longer per-line; it's per-task or per-sprint.
Enterprise adoption is forcing organizational context problems into the open. Engineering leaders at 500+ person companies are discovering that AI agents work great in isolation and catastrophically at scale. The agent doesn't know that the payments module is owned by a team on PCI compliance lockdown. It doesn't know that auth_legacy serves 40% of revenue and nobody touches it on Fridays.
MCP became a real standard. The Model Context Protocol gives this company a natural protocol surface. Without MCP, building context delivery requires custom integrations with every agent. With MCP, you build one server and every compliant agent instantly gets context. The distribution channel arrived.

The product was impossible before MCP existed and unnecessary before agents were autonomous. Both became true in the last 18 months.

Section 3 — Top 50 Failures (Ranked)
Rather than an exhaustive list, here are the top 20 with full analysis, then 21-50 in summary. The honest truth: failures cluster into 5 categories, and ranking all 50 individually is false precision.
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.25s;
    animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
VvisualizeVvisualize show_widgetHonest assessment of Section 3: The top 4 failures — ownership violation, silent downstream breakage, incident recurrence, and compliance blindness — account for roughly 80% of the economic damage. Building for those 4 is sufficient to reach $10M ARR. Don't let the 50-item list distract from that.

Section 4 — The Wedge
Selected wedge: Change Risk Scoring
Not ownership intelligence. Not a full context API. Not a safety layer. Specifically: when an AI agent proposes a change, score the risk of that change before it merges.
Why this and not the others:
Ownership Intelligence is valuable but requires substantial data collection before it produces value. You need to ingest org charts, CODEOWNERS, Slack, Jira, incident history — and synthesize them into ownership claims that engineers will trust. That's a 6-month data problem before you have a sellable answer.
AI Agent Safety Layer is the right long-term framing but the wrong wedge. "Safety" is diffuse. Buyers can't point to a line item. CTOs say "we need safety" but don't know what to buy.
Change Risk Scoring is the wedge because:

It's a point-in-time product, not a platform. One API call: "here's a diff, what's the risk?" The customer doesn't need to trust your entire data model. They just need the score to be right enough that they'd want it before merging.
It has a natural home in CI/CD. GitHub Actions, GitLab CI, Bitbucket — every engineering team already has a step where checks run before merge. Adding a risk score step is a 10-minute integration. No new workflow.
It creates urgency. When an agent proposes a PR that touches the payments module at 3am on a deployment freeze day, the risk score screams. Without it, that PR merges silently.
It seeds proprietary data immediately. Every scored change teaches the system which factors correlate with actual incidents. After 6 months of scoring, the model gets dramatically better and competitors can't catch up without that incident correlation data.
The failure mode is safe. If the score is wrong, someone reviews more carefully. There's no catastrophic downside to a false positive. This is important for early sales — buyers don't fear the product.

Why not the other candidates:
Code Context API is too broad. It's infrastructure for other people's products. The customer would be other tool vendors, not engineering teams. That's a platform company, not a wedge.
Review Routing is real pain but it's a feature of GitHub/GitLab, not a standalone product. Hard to get budget for.
Deployment Risk Prediction is downstream of Change Risk Scoring — it's what you build in Stage 2 after you have enough data.

Section 5 — Customer Discovery
First customer profile:

Company type: Series B/C SaaS company, 80–200 engineers
Industry: Fintech, healthcare tech, or dev tools (compliance pressure + AI adoption happening simultaneously)
Tech stack: Monorepo or modular monolith with some service extraction underway
Agent usage: Platform team has deployed Cursor or Claude Code to 30–60% of engineers. Some early adopters are using it autonomously (not just autocomplete).
Pain signal: They've had at least one "the agent touched something it shouldn't have" incident. The CTO or VP Eng is nervous enough to have discussed internal AI guardrails but hasn't bought anything yet.

First team: Platform Engineering or Developer Experience team. They own CI/CD, tooling, and code quality. They feel responsible when agent-generated code causes problems. They have budget, they understand APIs, and they can unblock a trial without going through full procurement.
Their current workflow:
Engineer opens Cursor → prompts agent to implement feature → agent opens files across multiple directories → generates large PR → engineer reviews (often cursorily) → CI runs linting/tests → merges. Nowhere in this flow does anything evaluate organizational risk.
Current alternatives and their failures:

Manual CODEOWNERS review: Requires humans to be aware of what the agent touched. Doesn't scale when PRs span 30 files.
Static analysis (Sonar, CodeClimate): Catches code quality, not organizational context. Doesn't know that a file with perfect static analysis is owned by a PCI-locked team.
Internal wikis / Confluence: Not integrated into the change flow. Nobody checks Confluence before merging.
Nothing: The most common alternative. Teams are relying on senior engineers to catch problems in review, and senior engineers are drowning.

Why they'd buy immediately:
They've already had the incident. The CTO used it as a case study in an all-hands. The platform team was asked to "figure out guardrails for the AI agents." They're actively looking. A tool that installs in 10 minutes, plugs into existing CI, and puts a risk score on every agent-generated PR is the exact product they're searching for. The price point ($2–5K/month) is within platform team discretionary budget — no executive sign-off needed.

Section 6 — MVP
What the MVP does:

GitHub App (or GitLab webhook equivalent): installs in 10 minutes, receives PR events
Change analysis: On each PR opened by an AI agent (detected by commit author or PR label), analyzes: which files changed, CODEOWNERS for those files, change size and blast radius, whether a deployment freeze is active (via simple config file in repo), keywords indicating sensitive paths (payments, auth, pii, gdpr, legacy)
Risk score (1–10) with 3–5 sentence explanation: Posted as PR comment. "Risk: 8/10 — this PR modifies src/payments/ which is owned by the Payments team (not the author) and touches 3 files with PII data patterns. The auth_middleware module has been involved in 2 incidents in the last 90 days. Consider requesting Payments team review before merging."
Slack notification: Optional Slack alert to channel when risk score ≥ 7
Simple dashboard: List of recent PRs with risk scores, trends over time

What the MVP does NOT do:

Knowledge graph / neo4j / anything exotic
Incident ingestion (manual entry only in MVP)
Jira/Linear integration
Ownership inference (uses CODEOWNERS file directly)
Custom risk models
Multi-repo analysis
SSO / enterprise auth

Technical shortcuts:

CODEOWNERS parsing is a solved problem (10 lines of code)
Risk scoring in MVP is deterministic rules + one LLM call for the explanation, not ML
No vector database — keyword matching + CODEOWNERS + config is sufficient for MVP
SaaS-only, no self-hosted option
Postgres for everything, no graph database

Manual operations allowed:

Incident history collected via a simple web form founders fill out with customer ("what are your top 3 most dangerous files/modules?") — not automated ingestion
Onboarding done by founder on Zoom for first 10 customers

Reality check: This MVP could be built in 6 weeks, not 90 days, by one competent engineer using Claude Code. The 90 days is for iteration, customer discovery, and getting the first 5 customers using it.

Section 7 — Product Flow
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.25s;
    animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
VvisualizeVvisualize show_widgetThe flow has two modes. Reactive mode (PR-time) is the MVP — intercept the change after the agent writes it but before it merges. Proactive mode (via MCP) is Stage 2 — the agent queries context before writing code and gets guidance that shapes the output. Proactive mode is more valuable but requires MCP adoption to be widespread enough to matter. Build reactive first, shift to proactive as MCP matures.

Section 8 — Technical Design
Honest answer: the MVP requires almost no novel infrastructure.
The temptation with this product is to immediately reach for a knowledge graph because "organizational context" sounds like it needs one. This is wrong for the MVP.
What you actually need:
A Postgres database, a GitHub App, a background job worker, and one LLM call per PR. That's it.
Component analysis:
Do you need Neo4j or a knowledge graph?
No, not for the MVP. CODEOWNERS is already a structured ownership graph stored in a flat file. Dependency relationships come from package.json, go.mod, requirements.txt — parseable without graph storage. You only need a graph database when queries require multi-hop traversal at scale (e.g., "find all services that transitively depend on this file"). That's a Stage 2 problem. Postgres with a self-referential adjacency table handles everything you need for 6 months.
Do you need a vector database?
No. Semantic search over docs and incidents sounds appealing but adds complexity without improving the MVP's core value proposition. The risk score in MVP comes from structured signals (file ownership, change size, keyword matching, historical incident count), not from semantic similarity. Add pgvector to Postgres later if needed.
Do you need ML?
No. Deterministic rules are fine for MVP and more trustworthy to buyers. "This file is owned by Payments team and has been in 2 incidents" is more credible than "our model gave it a 0.73 risk score." The LLM call generates the human-readable explanation, not the score itself.
Simple architecture:
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.25s;
    animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
VvisualizeVvisualize show_widgetWhen to upgrade each component:

Postgres → add pgvector: When customers want semantic search over incident history. Probably month 8–12.
Add graph queries: When multi-repo dependency traversal becomes a customer request. Probably year 2.
Add ML scoring: When you have enough labeled outcome data (PR scored + whether it caused incident) to train a model that beats rules. Probably 18 months.
Self-hosted deployment: When you land your first F500 customer who won't send code to SaaS. Don't build it until you have that customer.


Section 9 — MCP Strategy
MCP is the right bet. Anthropic is pushing it hard, it's gaining adoption in Cursor, Claude Code, and Windsurf. Assume it wins.
MCP server design: three tools, two resources, one prompt.
Tools (agent can call these):

score_change(files: string[], diff: string, agent_id: string) → RiskScore — The core wedge, exposed as MCP. Agent calls before opening a PR or even before writing. Returns risk score + reasoning + suggested reviewers.
get_ownership(file_path: string) → OwnershipContext — Returns who owns this file, their slack handle, team, any restrictions, and when they're typically available. The agent uses this to know who to loop in.
get_constraints(scope: string) → Constraints — Returns deployment windows, compliance constraints, known fragile patterns, and ADRs relevant to a file or service.

Resources (agent reads these):

context://codebase/{repo} — High-level context about the codebase: teams, ownership structure, key modules and their sensitivity ratings.
context://incidents/{service} — Recent incidents affecting a service, their root causes, and the code patterns that triggered them.

Prompt:

safe_agent_preamble — A system prompt fragment the agent can include that instructs it to call get_constraints and get_ownership before modifying any file. This becomes the "just add this to your Claude Code config" onboarding experience.

How each agent integrates:

Cursor/Claude Code: Users add the MCP server URL to their ~/.cursor/mcp.json. The agent starts calling context tools before proposing changes. Zero workflow change for the engineer.
Devin: API integration. Devin's orchestrator calls score_change before submitting work for human review.
OpenHands/future agents: Same MCP protocol. One server, all agents.

The MCP flywheel: Every time an agent calls these tools, the product learns what signals agents care about, which context they use, and what they ignore. This is data competitors don't have.

Section 10 — Proprietary Data
What gets collected that competitors can't easily replicate:

Change-outcome correlation. For every PR the product scores, it observes whether the change caused an incident, required rollback, or had high review churn. After 12 months of data across 50+ companies, the model knows that "changes to files with >3 contributors in the last 30 days + touched by agent + Friday afternoon = 4× higher incident rate." No competitor can replicate this without the deployment and incident data.
Organizational topology. Which teams own which code, how that evolves over time, how ownership correlates with risk. This is messy, implicit data that exists nowhere in structured form. The product makes it explicit and machine-readable. The dataset is valuable independent of the application.
Agent behavior patterns. The product sees what every agent modifies, at what frequency, in what patterns. This is an entirely new dataset that nobody has. Which agents are riskier? Which types of prompts generate riskier diffs? Which codebases are more fragile? The answers compound into a competitive advantage.
Incident causal mapping. By connecting code changes to incidents across organizations, the product builds a corpus of "what code patterns cause what kinds of failures." This is the equivalent of actuarial tables for code risk. It's extremely hard to build from scratch and becomes more accurate with every customer.

Why competitors can't easily copy:
Cursor and GitHub Copilot see the code but don't see the incidents. PagerDuty sees the incidents but doesn't see the code changes. Jira sees the tickets but doesn't have the organizational context. This product sits at the intersection of all three and is the only one building the join.
The honest caveat: This moat takes 18–24 months to become meaningful. In the first year, the product is copyable. The early customers need to be acquired and retained before the data advantage kicks in.

Section 11 — Competition
Honest competitive analysis, not a cheerleading exercise:
Cursor — Could build this. Has the agent integration layer. Does NOT have the organizational context data or the CI/CD integration muscle. Cursor is fundamentally a developer tool; adding enterprise risk infrastructure is a product and GTM pivot. They probably won't. But if they do, this company needs to be so deeply integrated into enterprise CI/CD that ripping it out is painful.
GitHub Copilot / Microsoft — Most dangerous long-term competitor. GitHub owns the repository layer where this product lives (PR comments, CODEOWNERS, Actions). They could add "agent risk scoring" as a Copilot feature within 12 months. Counter: GitHub moves slowly for enterprise features. GitHub Actions ecosystem is open. The product needs to be indispensable before Microsoft ships a native feature. The window is approximately 18–24 months.
Devin (Cognition) — Not a competitor. They're building the agent. This product is infrastructure the agent depends on. Devin could become a customer, not a competitor.
Sourcegraph — Most technically overlapping competitor. Sourcegraph understands code at the organizational level. They have Cody as an AI layer. But Sourcegraph is fundamentally code search/intelligence for humans, not a risk layer for agents. Their sales motion is different (developer productivity, not AI safety). They could pivot, but they'd be abandoning their positioning. Risk: medium.
Atlassian — Owns Jira, Confluence, Bitbucket. Has the organizational context (projects, teams, incidents). Does not have the AI agent integration layer. Could acquire this company at $50–200M before it becomes a threat. This is the most likely exit, not IPO.
Glean — Enterprise search/knowledge. Not in the coding/agent workflow at all. Not a real competitor.
Graphite — Code review tooling. Adjacent but not the same problem. Could add risk scoring. Small company; unlikely to be the category winner.
Linear — Issue tracking. Has team context but not code ownership or agent integration. Not a real competitor.
The honest kill scenario: GitHub ships native "agent risk scoring" in GitHub Actions, prices it free, and positions it as a Copilot Enterprise feature. The startup survives only if it's already the industry standard by that point (first-mover data advantage + deep CI/CD integrations) or if it's already been acquired.

Section 12 — GTM
First 10 customers — months 1–4:
The founder's network is the GTM strategy. This is not a weakness; it's the right approach.
Target: VP/Director Eng at Series B/C companies where the founder has a warm connection or where there's a documented "AI coding incident" (blog post, tweet, conference talk). Search LinkedIn for "Engineering Manager" + "AI coding" + "lessons learned."
The pitch is not a demo. It's a question: "Have you had a situation where an AI agent touched something it shouldn't have?" If yes, the next question is "want to install something that takes 10 minutes and flags that before it merges?" Close rate from this conversation should be >50% for a free trial.
Convert trial to paid at $500–1,500/month for small teams. Don't optimize price here — optimize for reference customers.
First 100 customers — months 5–12:
The channel is platform engineers who've heard the founder speak or seen a blog post. Invest in:

One detailed post-mortem blog post per month: "How AI agents cause silent outages and how to prevent them." Rank on SEO terms platform engineers search after incidents.
One conference talk (PlatformCon, GitHub Universe, internal DevDay events) showing a real customer risk score in action.
A "AI Agent Safety" Slack community where platform engineers share stories. This becomes the distribution channel.

Price: $2,000–5,000/month for 50+ seat teams.
First $1M ARR:

30 customers at $2,500/month average = $900K ARR. Achievable in 12–15 months.
The expansion model: land platform team → expand to all AI-generated PRs → expand to all PRs (agent-generated or not) → $5–10K/month per customer.
First enterprise contract ($25–50K ACV) probably comes from a customer who had a real incident and needs to report to their board that they have AI governance controls. That story needs to be on the website.


Section 13 — Expansion Strategy
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.25s;
    animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
  }
VvisualizeVvisualize show_widget