---
trigger: manual
---

# Request Handling Guidelines (RAG + Notion MCP)

## Core Principles
- RAG MCP is the source of truth for knowledge.
- Notion MCP is the source of truth for work tracking, progress, and updates.
- Model priors MUST NOT override MCP data.

---

## Mandatory Knowledge Retrieval Policy (RAG MCP)

1. **Determine Knowledge Dependency**
   - Any factual, technical, architectural, historical, or project-related request is knowledge-dependent.

2. **Mandatory MCP Retrieval**
   - The agent MUST query the RAG MCP before generating any answer.
   - Retrieval is REQUIRED even if the model believes it knows the answer.

3. **Grounded Response Requirement**
   - If relevant context is found:
     - The response MUST be strictly grounded in retrieved content.
   - If no relevant context is found:
     - Explicitly state that the knowledge base does not contain the information.
     - Only then provide a best-effort response.

4. **Hallucination Prevention**
   - Any response not based on MCP retrieval is invalid.
   - No assumptions, fabrications, or inferred facts are allowed.

5. **Self-Verification (Required)**
   - Confirm MCP was queried.
   - Confirm retrieved content influenced the answer.
   - If not, re-run retrieval.

---

## Work Tracking & Updates Policy (Notion MCP)

### Notion Pages & Routing Rules (MANDATORY)

The agent MUST use the correct Notion page based on the nature of the update:

#### 1. **Ultimate-SD**
Use this page for:
- Project-level progress
- Architecture or system changes
- MCP / agent / infra integrations
- Design decisions
- Milestones or major outcomes
- Cross-task summaries (daily or weekly)

This page represents the **high-level evolution of the project/system**.

---

#### 2. **Tasks Tracker**
Use this page for:
- Individual tasks or tickets
- Day-to-day execution updates
- Task start, progress, pause, completion
- Blockers and next steps at task level

This page represents **operational task tracking**.

> **Note:** Currently experiencing API issues with Tasks Tracker database queries. Use Ultimate-SD page as fallback until resolved. See `.agent/rules/notion-api-issue.md` for details.

---

If an update fits both:
- Log detailed execution in **Tasks Tracker**
- Log a concise summary or outcome in **Ultimate-SD**

---

### When to Write to Notion MCP (MANDATORY)

The agent MUST create or update a Notion entry when ANY of the following occur:
- Work is completed or partially completed
- A task is started, resumed, or paused
- A decision is made (technical or product)
- Progress, blockers, or next steps are identified
- A daily update, summary, or status is implied or requested
- The agent communicates a user-visible claim of work or progress

> If the agent states that something was done, achieved, or changed, it MUST be logged in Notion.

---

### What to Log in Notion (Required Fields)

Each Notion update MUST include:

- **Date & Time** (ISO format preferred)
- **Type** (Started / Progress / Completed / Blocked / Decision)
- **What was done**
- **What was achieved / outcome**
- **Current status**
- **Next steps (if any)**

> **Template Reference:** See `.agent/rules/notion-update-template.md` for structured templates and examples.

---

### Logging Rules

- Updates MUST be concise, factual, and chronological.
- No speculative or future work should be logged as completed.
- Duplicate entries for the same action MUST be avoided.
- If a similar update exists for the same task and date, the agent MUST update the existing entry instead of creating a new one.
- If unsure whether an update should be logged, LOG IT.
- If unsure which Notion page to use, default to **Tasks Tracker**.

---

## Priority Order (Critical)

1. Notion MCP (work tracking, updates, history)
2. RAG MCP (knowledge, facts, context)
3. Model reasoning (only after MCPs)

---

## Default Behavior

- Assume all meaningful work must be tracked.
- Assume MCPs must be consulted.
- If in doubt, retrieve first and log the update.

Failure to retrieve or log when required is a violation of these rules.