# Diagram Save/Load Feature - Visual Guide

## 🎨 UI Overview

### Toolbar Location
```
┌─────────────────────────────────────────────────────────────────┐
│ [Select] [Rectangle] [Circle] [Database] ... [Arrow] [Text]    │
│    │                                                             │
│    └─ Drawing Tools                                             │
│                                                                  │
│ [Undo] [Redo] │ [Save] [Load] │ [Grid] [Fullscreen] ...       │
│               └─── NEW FEATURE                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Button Appearance

#### Save Button
```
┌──────────┐
│ 💾 Save  │  ← Icon + Label
└──────────┘
   Click to download .sdd file
```

#### Load Button
```
┌──────────┐
│ 📤 Load  │  ← Icon + Label
└──────────┘
   Click to open file picker
```

## 📱 User Flow Diagrams

### Save Flow
```
User creates diagram
        ↓
Clicks "Save" button
        ↓
    Has elements?
    /          \
  YES          NO
   ↓            ↓
File         Warning:
downloads    "Diagram is empty!"
   ↓
Success toast appears
"Diagram saved! (X elements)"
```

### Load Flow
```
User clicks "Load"
        ↓
File picker opens
        ↓
User selects file
        ↓
    .sdd file?
    /         \
  YES          NO
   ↓            ↓
Valid JSON?   Error:
/        \    "Invalid format!"
YES      NO
 ↓        ↓
Load    Error:
diagram "Failed to load!"
 ↓
Success toast
"Loaded! (X elements)"
```

## 🎬 Feature Demo Scenarios

### Scenario 1: Creating a Template
```
Step 1: Draw 3-tier architecture
┌─────────────────────────────┐
│  [Client]                   │
│     ↓                       │
│  [Load Balancer]            │
│     ↓                       │
│  [Server] ← [Cache]         │
│     ↓                       │
│  [Database]                 │
└─────────────────────────────┘

Step 2: Click "Save"
→ Downloads: "system-diagram-1700000000.sdd"

Step 3: Rename file
→ "template-3tier-webapp.sdd"

Step 4: Use template later
→ Click "Load" → Select template → Customize
```

### Scenario 2: Collaborative Review
```
Designer A                    Designer B
    │                             │
Create diagram                    │
    │                             │
Save as "proposal-v1.sdd"        │
    │                             │
Share file ─────────────────────>│
                                  │
                            Load file
                                  │
                            Review & modify
                                  │
                        Save as "proposal-v2.sdd"
                                  │
<───────────── Share back ────────┘
    │
Load v2
    │
Review changes
```

### Scenario 3: Version Control
```
Time  Action                    File
──────────────────────────────────────────
10:00 Initial design            v1-initial.sdd
      ↓ (edit)
11:00 Added caching             v2-cache.sdd
      ↓ (edit)
12:00 Improved scalability      v3-scale.sdd
      ↓ (edit)
13:00 Final version             v4-final.sdd

Compare versions:
v1.sdd ─┐
v2.sdd ─┼─→ Load each → Review → Choose best
v3.sdd ─┘
```

## 🎯 Toast Notifications

### Success - Save
```
┌─────────────────────────────────────┐
│ ✅ Diagram saved successfully!      │
│    (12 elements)                    │
└─────────────────────────────────────┘
    Bottom-right corner, 3s duration
```

### Success - Load
```
┌─────────────────────────────────────┐
│ ✅ Diagram loaded successfully!     │
│    (15 elements)                    │
└─────────────────────────────────────┘
    Bottom-right corner, 3s duration
```

### Warning - Empty
```
┌─────────────────────────────────────┐
│ ⚠️  Your diagram is empty!          │
│    Nothing to save.                 │
└─────────────────────────────────────┘
    Bottom-right corner, 3s duration
```

### Error - Invalid Extension
```
┌─────────────────────────────────────┐
│ ❌ Invalid file format!             │
│    Please select a .sdd file.      │
└─────────────────────────────────────┘
    Bottom-right corner, 3s duration
```

### Error - Invalid Content
```
┌─────────────────────────────────────┐
│ ❌ Failed to load diagram!          │
│    Invalid file format.             │
└─────────────────────────────────────┘
    Bottom-right corner, 4s duration
```

## 📂 File Structure Visualization

### .sdd File Contents
```
system-diagram-1700000000.sdd
│
├─ version: "1.0"
│
├─ type: "system-design-diagram"
│
├─ timestamp: "2025-11-17T12:00:00.000Z"
│
├─ elements: [
│   ├─ element 1 {
│   │   id: "1700000001",
│   │   type: "client",
│   │   x: 100, y: 100,
│   │   width: 120, height: 80,
│   │   text: "Web Client",
│   │   color: "#3b82f6"
│   │  }
│   │
│   ├─ element 2 { ... }
│   │
│   └─ element N { ... }
│  ]
│
└─ settings: {
    showGrid: true
   }
```

### File Comparison View
```
Before Save              After Save
──────────────────────────────────────
Canvas with elements  →  .sdd file
(in memory)              (on disk)

[Client]                 {
   ↓                       "elements": [
[Server]                     {"type": "client"...},
   ↓                         {"type": "server"...},
[Database]                   {"type": "database"...}
                           ]
                         }
```

## 🔄 State Transitions

### Canvas State Machine
```
          EMPTY
            │
            │ Draw elements
            ↓
          ACTIVE ────────┐
        ╱   │    ╲       │
       ╱    │     ╲      │
Save  ╱     │      ╲ Clear
     ╱      │       ╲    │
    ↓       │ Load   ↓   ↓
SAVING      ↓      LOADING
    │    REPLACED    │
    │       │        │
    └───────┴────────┘
            ↓
          ACTIVE
```

## 🎨 Component Integration

### Toolbar Layout
```
┌────────────────────────────────────────────────────┐
│ [Drawing Tools Group]                              │
│ • Select, Rectangle, Circle, Database, etc.       │
└────────────────────────────────────────────────────┘
         │
┌────────────────────────────────────────────────────┐
│ [System Components Group]                          │
│ • LoadBalancer, Cache, Queue, API, etc.           │
└────────────────────────────────────────────────────┘
         │
┌────────────────────────────────────────────────────┐
│ [History Group]                                    │
│ • Undo, Redo                                       │
└────────────────────────────────────────────────────┘
         │
┌────────────────────────────────────────────────────┐
│ [FILE GROUP] ← NEW!                                │
│ • Save, Load                                       │
└────────────────────────────────────────────────────┘
         │
┌────────────────────────────────────────────────────┐
│ [View Group]                                       │
│ • Grid, Fullscreen, Label, Delete, Clear          │
└────────────────────────────────────────────────────┘
```

## 🎯 Interactive Elements

### Save Button States
```
Default State:
┌──────────┐
│ 💾 Save  │  ← Gray (ghost variant)
└──────────┘

Hover State:
┌──────────┐
│ 💾 Save  │  ← Light blue background
└──────────┘

Active (Click):
┌──────────┐
│ 💾 Save  │  ← Darker blue
└──────────┘

Disabled (empty):
Not applicable - shows warning instead
```

### Load Button States
```
Default State:
┌──────────┐
│ 📤 Load  │  ← Gray (ghost variant)
└──────────┘

Hover State:
┌──────────┐
│ 📤 Load  │  ← Light blue background
└──────────┘

Active (Click):
┌──────────┐
│ 📤 Load  │  ← Opens file picker
└──────────┘
```

## 📱 Responsive Behavior

### Desktop (>1024px)
```
┌─────────────────────────────────────────┐
│ All buttons visible in single row       │
│ [Tools] | [System] | [Undo/Redo] |     │
│ [Save/Load] | [View]                    │
└─────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────────┐
│ Buttons wrap to multiple rows           │
│ [Tools] | [System]                      │
│ [Undo/Redo] | [Save/Load] | [View]     │
└─────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────────────┐
│ Compact view, buttons wrap              │
│ [Tools...]                              │
│ [System...]                             │
│ [Actions...]                            │
└─────────────────────────────────────────┘
Note: All functionality preserved
```

## 🎪 Animation & Feedback

### Toast Animation
```
Initial:    opacity: 0, transform: translateY(20px)
            ↓ (50ms)
Visible:    opacity: 1, transform: translateY(0)
            ↓ (wait 3000ms)
Exit:       opacity: 0, transform: translateY(20px)
            ↓ (300ms)
Removed:    Element removed from DOM
```

### Button Click Feedback
```
1. Click
   ↓
2. Button scales down (0.95)
   ↓
3. Action executes
   ↓
4. Button returns to normal
   ↓
5. Toast appears with result
```

### File Picker Flow
```
Click "Load"
     ↓
Browser shows file dialog
     ↓
User navigates filesystem
     ↓
Selects file
     ↓
Dialog closes
     ↓
File loads (if valid)
     ↓
Toast confirms success
```

## 🎓 Learning Path

### For Beginners
```
1. Draw simple shapes
   ↓
2. Click "Save" → See file download
   ↓
3. Clear canvas
   ↓
4. Click "Load" → Select saved file
   ↓
5. See diagram reappear
   ↓
Understand: Diagrams can be saved & restored!
```

### For Intermediate Users
```
1. Create complex architecture
   ↓
2. Save multiple versions
   ↓
3. Compare by loading each
   ↓
4. Learn versioning workflow
   ↓
Understand: Files enable iteration!
```

### For Advanced Users
```
1. Build template library
   ↓
2. Organize by patterns
   ↓
3. Share with team
   ↓
4. Establish conventions
   ↓
Understand: Templates scale productivity!
```

## 🎬 Real-World Usage Example

```
Interview Practice Session
──────────────────────────────────────────

09:00 - Problem: "Design Instagram"
        │
        ├─ Draw initial architecture
        │  [Mobile App] → [API] → [Database]
        │
        ├─ Save as "instagram-v1-basic.sdd"
        │
09:30 - Add caching layer
        │  [Mobile] → [API] → [Cache] → [DB]
        │
        ├─ Save as "instagram-v2-cache.sdd"
        │
10:00 - Add CDN for images
        │  [Mobile] → [CDN] → [Object Storage]
        │           ↓
        │         [API] → [Cache] → [DB]
        │
        ├─ Save as "instagram-v3-cdn.sdd"
        │
10:30 - Review with AI
        │  AI: "Great! Consider adding load balancer"
        │
        ├─ Load "instagram-v3-cdn.sdd"
        ├─ Add load balancer
        │
        └─ Save as "instagram-v4-final.sdd"

Result: 4 versions showing design evolution!
```

## 🎯 Key Takeaways

1. **Simple UI**: Two buttons (Save/Load)
2. **Clear Feedback**: Toast notifications for all actions
3. **Validation**: File type and content checks
4. **Preserves Work**: Complete diagram state saved
5. **Portable**: JSON files work anywhere
6. **No Backend**: All client-side operations
7. **Version Friendly**: Files can be compared/tracked

---

**Visual Summary**: 
```
┌──────┐   ┌──────┐   ┌──────┐
│ Draw │ → │ Save │ → │ File │
└──────┘   └──────┘   └──────┘
                           ↓
┌──────┐   ┌──────┐   ┌──────┐
│ Draw │ ← │ Load │ ← │ File │
└──────┘   └──────┘   └──────┘
```

**That's it!** Simple, visual, and powerful. 🎨✨
