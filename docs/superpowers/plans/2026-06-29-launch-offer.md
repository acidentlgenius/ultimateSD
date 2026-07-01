# Launch Offer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Promote the launch offer (50 × free 3-month Platform/BYOK, 5 × free 3-month AI) on landing and pricing pages, let users claim or enter, and show redemption analytics on the admin dashboard.

**Architecture:** `LaunchOfferRedemption` ledger in Prisma. Platform slots are FCFS via atomic server action; AI giveaway is an entry pool with admin-triggered random draw. Shared config in `lib/launch-offer.ts`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL, Vitest

**App root:** `ultimate-sd/`

---

## Offer mechanics

| Tier | Benefit | Cap | How users get it |
|------|---------|-----|------------------|
| Launch Platform | 3 months `platform` (BYOK) | 50 | Logged-in user clicks Claim — FCFS |
| Launch AI giveaway | 3 months `ai` plan | 5 | Enter giveaway — admin draws winners |

AI winners: admin draw from entry pool (option 1).
