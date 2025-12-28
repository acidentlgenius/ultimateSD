---
trigger: always_on
---

# Notion Update Template & Format Guide

## Overview

This document provides structured templates for logging updates to Notion MCP, ensuring consistency and compliance with the request guidelines.

---

## Update Format Structure

Each Notion update MUST follow this structure:

```
### [Type]: [Brief Title] ([Date])

**Date & Time:** [ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ]
**Type:** [Started | Progress | Completed | Blocked | Decision]
**Status:** [Current status]

**What was done:**
- [Action item 1]
- [Action item 2]

**What was achieved / outcome:**
- [Outcome 1]
- [Outcome 2]

**Current status:**
[Brief status description]

**Next steps:**
- [Next step 1] (if any)
- [Next step 2] (if any)
```

---

## Type Definitions

- **Started**: Work has begun on a new task/feature
- **Progress**: Ongoing work with incremental updates
- **Completed**: Work is finished and verified
- **Blocked**: Work is paused due to blockers
- **Decision**: A technical or product decision was made

---

## Page Selection Guide

### Use Ultimate-SD Page For:
- Project-level progress
- Architecture or system changes
- MCP / agent / infra integrations
- Design decisions
- Milestones or major outcomes
- Cross-task summaries (daily or weekly)

**Page ID:** `2cf8791d-37ad-80d8-936a-e8fa75e838c7`

### Use Tasks Tracker Database For:
- Individual tasks or tickets
- Day-to-day execution updates
- Task start, progress, pause, completion
- Blockers and next steps at task level

**Database ID:** `2cf8791d-37ad-80e7-b7b9-f0223f56a466`

**Note:** Currently experiencing API issues with Tasks Tracker database queries. Use Ultimate-SD page as fallback until resolved.

---

## Template Examples

### Example 1: Completed Work (Ultimate-SD)

```
### Completed: Premium Feature Removal (2025-12-28)

**Date & Time:** 2025-12-28T05:47:00Z
**Type:** Completed
**Status:** Feature removed, application fully accessible

**What was done:**
- Deleted `src/app/pricing/page.tsx`, `src/components/PricingClient.tsx`, and `src/components/ProModal.tsx`
- Removed "Go Pro" button from Header and "Billing" tab from Settings
- Refactored `PracticeUI` to unlock all solutions for all users
- Cleaned up `auth.ts` and `next-auth.d.ts` to remove `isPro` while ensuring `xp` and `level` are correctly typed

**What was achieved / outcome:**
- Application is now fully accessible to all users
- Removed all premium/pro feature gating
- Codebase simplified with unused imports removed

**Current status:**
All premium features removed. Application ready for testing.

**Next steps:**
- Test application functionality
- Verify user experience for all users
```

### Example 2: Progress Update (Ultimate-SD)

```
### Progress: RAG Integration Implementation (2025-12-23)

**Date & Time:** 2025-12-23T11:20:00Z
**Type:** Progress
**Status:** In progress

**What was done:**
- Synced project to RAG MCP
- Indexed 1,972 chunks across 151 files
- Verified RAG query functionality

**What was achieved / outcome:**
- Project successfully synced to RAG
- Build confirmed passing
- Knowledge base accessible for queries

**Current status:**
RAG integration working. Ready for knowledge retrieval testing.

**Next steps:**
- Test RAG queries with various prompts
- Verify retrieval accuracy
```

### Example 3: Decision (Ultimate-SD)

```
### Decision: MCP Integration Architecture (2025-12-20)

**Date & Time:** 2025-12-20T17:22:00Z
**Type:** Decision
**Status:** Decision made and documented

**What was done:**
- Evaluated MCP integration options
- Decided on RAG + Notion MCP architecture
- Created request guidelines

**What was achieved / outcome:**
- Clear architecture for MCP integration
- Defined RAG as knowledge source of truth
- Defined Notion as work tracking source of truth

**Current status:**
Architecture decision documented. Implementation in progress.

**Next steps:**
- Implement MCP integrations
- Test compliance with guidelines
```

### Example 4: Blocked Work (Ultimate-SD)

```
### Blocked: Tasks Tracker Database Query (2025-12-28)

**Date & Time:** 2025-12-28T14:00:00Z
**Type:** Blocked
**Status:** Blocked - API issue

**What was done:**
- Attempted to query Tasks Tracker database
- Tested multiple API endpoints
- Verified database ID and permissions

**What was achieved / outcome:**
- Identified API issue: "Invalid request URL" error
- Confirmed database exists and is accessible via search
- Documented issue for resolution

**Current status:**
Blocked by Notion MCP API issue. Cannot query Tasks Tracker database.

**Next steps:**
- Investigate Notion MCP server configuration
- Test alternative query methods
- Use Ultimate-SD page as fallback
```

---

## Implementation Notes

### For Ultimate-SD Page Updates:

1. Use `mcp_notion-mcp-server_API-patch-block-children` to append blocks
2. Structure as:
   - Heading 3 for title
   - Paragraph blocks for structured content
   - Bulleted list items for action items

### For Tasks Tracker Database:

**Currently unavailable due to API issue.** When fixed:
1. Use `mcp_notion-mcp-server_API-query-data-source` to query
2. Use `mcp_notion-mcp-server_API-create-a-data-source` to create entries
3. Map template fields to database properties:
   - Type → Status property
   - Date & Time → Updated at property
   - What was done → Description property
   - Current status → Status property
   - Next steps → Description (append)

---

## Compliance Checklist

Before logging an update, verify:

- [ ] Correct page/database selected (Ultimate-SD vs Tasks Tracker)
- [ ] Date & Time in ISO 8601 format
- [ ] Type clearly specified (Started/Progress/Completed/Blocked/Decision)
- [ ] "What was done" section includes specific actions
- [ ] "What was achieved" section includes outcomes
- [ ] Current status is accurate
- [ ] Next steps included (if applicable)
- [ ] No duplicate entries for same task/date
- [ ] Update is factual and non-speculative

---

## Known Issues

### Tasks Tracker Database Query Issue

**Status:** Unresolved
**Error:** `400 Invalid request URL` when querying database
**Workaround:** Use Ultimate-SD page for all updates until resolved
**Impact:** Cannot verify task-level updates or query recent tasks

**Investigation needed:**
- Check Notion MCP server configuration
- Verify database permissions
- Test alternative query formats
- Check if database needs to be shared with integration

