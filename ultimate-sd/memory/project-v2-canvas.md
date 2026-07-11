---
name: project-v2-canvas
description: V2 infinite canvas design — what it is, what it replaces, key constraints
metadata:
  type: project
---

# V2 Canvas Design — Project Context

V2 transforms `/practice/[slug]` from a form-based step-by-step wizard into an **infinite canvas whiteboard session**.

**Why:** The existing V1 UI (left sidebar with phase list, main area with textarea/list inputs, Submit for Review button) feels like a form, not an interview. V2 mimics a real whiteboard session.

**Key decision:** V2 is feature-flagged behind `problemFlowV2`. V1 code stays unchanged. Mobile (<768px) always gets V1.

## What V2 Looks Like

- Dark background (#0e0f12) with dot grid (24px)
- 3200×1700 virtual canvas, camera pans to active stage region
- 7 stages: Problem (3min) → FR (5min) → NFR (5min) → Entities (5min) → API (5min) → HLD (15min) → Deep Dives (10min)
- Content uses Caveat (handwriting) font — looks like a whiteboard sketch
- Guide rail (292px right panel) with tips, suggestions, AI feedback per stage
- Bottom dock with stage ticks and ←→ navigation
- Timer, tool strip, breadcrumb float over canvas

## What Changes vs V1

| V1 | V2 |
|---|---|
| Left sidebar: phase + substep list | Bottom dock: 7 stage ticks |
| Main area: textarea/list form | Canvas regions with handwriting style |
| Submit for Review → AI feedback | "Read my canvas" → AI feedback |
| Generic steps for all problems | Per-problem entities, HLD, API data |
| Fixed layout | Camera pans to active region |
| Geist font throughout | Caveat for user content, Geist for labels |

## What Stays the Same

- Auth, access control, plan gating
- Timer (repurposed, positioned in corner)
- Session persistence (extended with canvasSnapshot)
- Problem library (all existing slugs)
- Feature flags system (extended with problemFlowV2)
- AI evaluation (repurposed for canvas feedback)
- PDF export (accessible via menu)

## Design Source

Prototype: `# Ultimate SD Canvas Redesign/Canvas Session.dc.html`  
Screenshot: `# Ultimate SD Canvas Redesign/uploads/Screenshot 2026-07-11 003624.png`  
Spec: `docs/superpowers/specs/2026-07-10-problem-flow-v2-design.md`

**Why:** Rolling out for interview prep platform users who want the whiteboard experience.  
**How to apply:** Always check spec before implementing any V2 component. When in doubt, open the prototype HTML in a browser.
