# Session Persistence - Visual Demo

## 🎬 User Journey Walkthrough

### Scenario 1: First-Time Practice

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: "Let me practice Design TinyURL"                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🌐 Browser: Opens /practice/design-tinyurl                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 System: Checks localStorage for saved session            │
│    localStorage.getItem('sd-practice-v1-design-tinyurl')    │
│    → null (no saved session)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🎯 UI: Starts at Requirements, Step 1                       │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ 📋 Requirements                    Step 1 of 3       │  │
│   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │                                                       │  │
│   │ Functional Requirements                               │  │
│   │ What are the core features...                         │  │
│   │                                                       │  │
│   │ [Add your requirements here]                          │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: Adds 5 requirements, clicks "Submit for Review"    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI: Evaluates answer, returns feedback                   │
│    Score: 8/10, Accuracy: 75%, isAcceptable: true           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 System: AUTO-SAVES to localStorage                       │
│    {                                                         │
│      currentPhase: "requirements",                           │
│      currentStepIndex: 0,                                    │
│      savedStepData: {                                        │
│        "requirements-0": {                                   │
│          listItems: [...5 requirements...],                  │
│          feedback: { score: 8, ... },                        │
│          completed: true                                     │
│        }                                                     │
│      },                                                      │
│      completedSteps: ["requirements-0"],                     │
│      lastUpdated: "2025-11-03T14:30:00Z"                     │
│    }                                                         │
│    ✅ SAVED!                                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🎯 UI: Shows footer indicator                               │
│                                                              │
│   💾 Session auto-saved • 1 step completed • 3.2 KB used    │
│   Your progress is automatically saved...                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 2: Accidental Refresh

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: Working on step 4... accidentally hits F5          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💥 Browser: Page refreshes!                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 System: Checks localStorage on mount                     │
│    localStorage.getItem('sd-practice-v1-design-tinyurl')    │
│    → Found! { currentPhase: "hld", currentStepIndex: 1 }    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ System: RESTORES all state                               │
│    - Current phase: HLD                                      │
│    - Current step: 1 (API Design)                            │
│    - Completed steps: 3                                      │
│    - All answers and feedback                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🎉 UI: Shows restoration banner                             │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ ℹ️ Session Restored!                            [×]  │  │
│   │ Your progress from Nov 3, 2025 at 2:30 PM has been  │  │
│   │ restored. Continue where you left off!               │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ 🏗️ HLD                            Step 2 of 3        │  │
│   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │                                                       │  │
│   │ API Design                                            │  │
│   │ Define the key APIs/endpoints...                      │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   💾 Session auto-saved • 3 steps completed • 12.8 KB used  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 😌 User: "Phew! Nothing lost. I can continue!"              │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 3: Close and Reopen (Next Day)

```
┌─────────────────────────────────────────────────────────────┐
│ 🌙 Day 1, 11 PM:                                            │
│ 👤 User: "I'm tired, let me close this and sleep"           │
│    (Closes browser tab)                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 localStorage: Data persists!                             │
│    (Survives tab close, browser close, even restart)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ☀️ Day 2, 9 AM:                                             │
│ 👤 User: Opens browser, navigates to /practice/design-...   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 System: Loads from localStorage                          │
│    Last updated: 16 hours ago                                │
│    Progress: 8/15 steps completed                            │
│    Current: Trade-offs phase, step 1                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ UI: Everything restored exactly as left                  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ ℹ️ Session Restored!                            [×]  │  │
│   │ Your progress from Nov 3, 2025 at 11:15 PM has been │  │
│   │ restored. Continue where you left off!               │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Requirements → HLD → LLD → [Trade-offs] → Scalability     │
│                                                              │
│   [Your Progress History]                                    │
│   ✅ Requirements - Functional (Score: 8/10)                │
│   ✅ Requirements - Non-functional (Score: 7/10)            │
│   ✅ Requirements - Constraints (Score: 9/10)               │
│   ✅ HLD - API Design (Score: 8/10)                         │
│   ✅ HLD - Data Model (Score: 7/10)                         │
│   ... and 3 more                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 😊 User: "Perfect! Picking up where I left off!"            │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 4: Clear and Start Fresh

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: "I want to try a different approach. Let me start  │
│          over from scratch."                                 │
│    (Clicks "🔄 Clear" button in header)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ System: Shows confirmation dialog                        │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Are you sure you want to clear all progress for     │  │
│   │  this problem? This cannot be undone.                 │  │
│   │                                                        │  │
│   │              [Cancel]  [Yes, Clear It]                │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: Clicks "Yes, Clear It"                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 System: REMOVES from localStorage                        │
│    localStorage.removeItem('sd-practice-v1-design-tinyurl') │
│    ✅ DELETED!                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🔄 System: Resets ALL state variables                       │
│    currentPhase → "requirements"                             │
│    currentStepIndex → 0                                      │
│    savedStepData → new Map()                                 │
│    completedSteps → new Set()                                │
│    listItems → []                                            │
│    textInput → ""                                            │
│    feedback → null                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ System: Shows success message                            │
│    alert("✅ Session cleared! Starting fresh.")             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 🎯 UI: Back to Requirements, Step 1 (clean slate)           │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ 📋 Requirements                    Step 1 of 3       │  │
│   │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│   │                                                       │  │
│   │ Functional Requirements                               │  │
│   │ What are the core features...                         │  │
│   │                                                       │  │
│   │ [Add your requirements here]  ← Empty, fresh start   │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   (No footer indicator - no saved data yet)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 😊 User: "Great! Now I can try my new approach!"            │
└─────────────────────────────────────────────────────────────┘
```

---

### Scenario 5: Multiple Problems

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: Practicing "Design TinyURL"                        │
│    Completes 5 steps → auto-saved                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 localStorage:                                             │
│    'sd-practice-v1-design-tinyurl' → {...5 steps...}        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: "Let me try Design YouTube too"                    │
│    Navigates to /practice/design-youtube                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 System: Checks for 'design-youtube' session → not found  │
│    Starts fresh for YouTube (doesn't affect TinyURL)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: Completes 3 steps on YouTube → auto-saved          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 💾 localStorage: NOW HAS BOTH!                              │
│    'sd-practice-v1-design-tinyurl' → {...5 steps...}        │
│    'sd-practice-v1-design-youtube' → {...3 steps...}        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 👤 User: "Let me go back to TinyURL"                        │
│    Navigates to /practice/design-tinyurl                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ System: Restores TinyURL session (5 steps)               │
│    YouTube session remains untouched in storage              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 😊 User: Can switch between problems freely!                │
│         Each maintains its own independent state!            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Behind the Scenes: localStorage Structure

```javascript
// What's actually stored in your browser:

localStorage = {
  // Problem 1
  'sd-practice-v1-design-tinyurl': '{
    "currentPhase": "hld",
    "currentStepIndex": 1,
    "savedStepData": {
      "requirements-0": {...},
      "requirements-1": {...},
      "requirements-2": {...},
      "hld-0": {...},
      "hld-1": {...}
    },
    "completedSteps": ["requirements-0", "requirements-1", ...],
    "lastUpdated": "2025-11-03T14:30:00.000Z"
  }',
  
  // Problem 2
  'sd-practice-v1-design-youtube': '{
    "currentPhase": "requirements",
    "currentStepIndex": 2,
    "savedStepData": {
      "requirements-0": {...},
      "requirements-1": {...},
      "requirements-2": {...}
    },
    "completedSteps": ["requirements-0", "requirements-1", ...],
    "lastUpdated": "2025-11-03T15:45:00.000Z"
  }',
  
  // Other app data (unrelated)
  'some-other-app-key': '...',
  // ...
}
```

---

## 📊 Storage Size Examples

```
Empty session (just started):
└─ ~500 bytes

After 1 step (5 requirements):
├─ Requirements: ["Req 1", "Req 2", ...]
├─ Feedback: {score: 8, accuracy: 75%, ...}
└─ ~3 KB

After 5 steps (mixed types):
├─ 3 list-based steps (requirements)
├─ 1 schema step (data model)
├─ 1 text step (architecture)
└─ ~15 KB

Full session (15 steps completed):
├─ All phases complete
├─ All feedback stored
├─ Large schemas and diagrams
└─ ~50 KB

Heavy session (lots of text):
├─ Long architectural descriptions
├─ Complex schemas with 20+ tables
├─ Detailed feedback on each
└─ ~150 KB
```

**Storage Capacity Check:**
```javascript
// You can check in browser console:
const info = getStorageInfo();
console.log(`Used: ${formatStorageSize(info.used)}`);
console.log(`Sessions: ${info.sessionCount}`);

// Output example:
// Used: 147.3 KB
// Sessions: 3
```

---

## 🎨 Visual Indicators At-a-Glance

```
Top of page (when restored):
╔═══════════════════════════════════════════════════╗
║ ℹ️ Session Restored!                          [×] ║
║ Your progress from Nov 3, 2025 at 2:30 PM...     ║
╚═══════════════════════════════════════════════════╝

Step header (when data exists):
┌───────────────────────────────────────────────────┐
│ 📋 Requirements    [Functional Requirements] 🔄   │
│ Step 1 of 3                                       │
└───────────────────────────────────────────────────┘
                                              ↑
                                         Clear button

Bottom of page (when data exists):
┌───────────────────────────────────────────────────┐
│ 💾 Session auto-saved • 8 steps • 42.5 KB        │
│ Your progress is automatically saved...           │
└───────────────────────────────────────────────────┘
```

---

**That's how session persistence works! 🚀**

Your practice sessions are now bulletproof against:
- Accidental refreshes ✅
- Browser crashes ✅
- Tab closures ✅
- Multi-day sessions ✅
- Parallel problem practice ✅
