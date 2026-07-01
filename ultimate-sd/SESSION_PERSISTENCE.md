# Session Persistence Feature

## Overview

The SysDesignAI platform includes **automatic session persistence** so your practice sessions survive page refreshes, browser restarts, and navigation away from a problem.

**Logged-in users:** Progress is stored in the database (practice sessions, step submissions, and progress summary). The server is the source of truth for completed work, scores, and session history.

**All users (including logged-in):** Browser `localStorage` acts as a **draft buffer only**—it holds in-progress UI state (current phase/step, unsaved answers) for fast restore on refresh. It is not synced to the cloud and is not used to recover completed submissions for authenticated users.

Your practice sessions are automatically saved and will be restored even if you:

- 🔄 Refresh the page
- 🚪 Close and reopen your browser
- 💻 Navigate away and come back later
- ⚡ Experience a browser crash

## How It Works

### Logged-in users (database)

When you are signed in:

- **Practice sessions** are created and tracked server-side (`PracticeSession`).
- **Step submissions** (answers, feedback, scores) are persisted to the database on submit.
- **Progress summary** (status, completed steps, active session) lives on `ProblemProgress`.
- On page load, the app reconstructs your session from the database—not from the legacy `sessionState` JSON column (removed).

localStorage still runs in the background as a **draft buffer** for the current tab (phase, step index, in-flight answers). If you refresh mid-step, that buffer restores the UI quickly; completed work always comes from the DB.

### Anonymous users (localStorage only)

Without an account, localStorage is the only persistence layer. Completed steps and answers are stored entirely in the browser until you sign up or clear the session.

### Automatic Saving

Every time you make progress, your session is **automatically saved** to your browser's localStorage:

- ✅ Current phase and step
- ✅ All completed steps and their feedback
- ✅ Your answers (list items, text, schemas)
- ✅ Scores and AI feedback
- ✅ Progress indicators

**No manual action required!** Just practice normally and your work is protected.

### Automatic Restoration

When you return to a practice session:

1. **Session Detection**: The system checks for saved progress
2. **Restoration**: All your data is loaded automatically
3. **Confirmation Banner**: You'll see a green banner confirming restoration with the date/time
4. **Continue Practicing**: Pick up exactly where you left off!

## Visual Indicators

### Restoration Banner

When a session is restored, you'll see a green notification banner:

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️  Session Restored!                              [X]  │
│ Your progress from Nov 3, 2025 at 2:30 PM has been     │
│ restored. Continue where you left off!                  │
└─────────────────────────────────────────────────────────┘
```

- Automatically disappears after 5 seconds
- Can be manually dismissed by clicking the X

### Session Info Footer

At the bottom of the page, you'll see:

```
💾 Session auto-saved • 8 steps completed • 42.5 KB used
Your progress is automatically saved and will be restored 
if you refresh or close the page
```

This shows:
- Number of completed steps
- Storage space used
- Confirmation that auto-save is working

### Clear Session Button

In the step header (when you have saved progress):

```
[Requirements]        [Functional Requirements]  [🔄 Clear]
Step 1 of 3
```

- Visible only when you have saved progress
- Click to clear ALL progress for this problem
- Requires confirmation to prevent accidents

## Storage Details

### What Gets Saved

For **each problem** you practice:

```typescript
{
  currentPhase: "HLD",              // e.g., Requirements, HLD, LLD, etc.
  currentStepIndex: 1,              // Which step within the phase
  savedStepData: {
    "requirements-0": {
      listItems: [...],             // Your list answers
      textInput: "...",             // Your text answers
      schemaData: [...],            // Your database schemas
      feedback: {                   // AI feedback received
        score: 8,
        accuracy: 75,
        strengths: [...],
        weaknesses: [...],
        missed: [...]
      },
      completed: true               // Whether you passed
    },
    // ... more steps
  },
  completedSteps: ["requirements-0", "requirements-1", ...],
  lastUpdated: "2025-11-03T14:30:00.000Z"
}
```

### Storage Location

- **Logged-in users:** PostgreSQL via server actions (`src/app/actions/progress/`). localStorage is a per-tab draft cache only.
- **Anonymous users:** Browser localStorage (per-browser, per-device).
- **Scope:** Per problem slug (multiple problems can be saved simultaneously).
- **Privacy:** Draft buffer stays local; authenticated progress is tied to your account in the database.

### Storage Capacity

- **Typical Session**: 20-50 KB
- **Large Session**: 100-200 KB (with many steps and long answers)
- **Browser Limit**: Usually 5-10 MB total for localStorage
- **Multiple Problems**: You can save ~50-100 different practice sessions

### Automatic Cleanup

If storage quota is exceeded:

1. System automatically clears **old sessions** (other problems)
2. Keeps the **current session** intact
3. Logs cleanup activity to console
4. Retries the save operation

## User Actions

### Clear Current Session

**When to use:**
- Starting over from scratch
- Testing different approaches
- Fixing mistakes in early steps

**How to:**
1. Click the "🔄 Clear" button in the step header
2. Confirm the action in the dialog
3. All progress for this problem is deleted
4. You start fresh at Requirements step 1

**Warning:** This action cannot be undone!

### View All Saved Sessions

Currently, sessions are viewed implicitly by navigating to problem pages. Future enhancement: dashboard showing all saved sessions.

### Export Before Clearing

**Best Practice:**
1. Click "Export PDF" in the header (if you want a record)
2. Wait for PDF download
3. Then clear the session if desired

## Technical Details

### Implementation

**Files:**
- `/src/lib/session-storage.ts` - Core persistence logic
- `/src/components/StepByStepChat.tsx` - Integration with UI

**Key Functions:**

```typescript
// Save current state
saveSessionState(problemSlug, {
  currentPhase,
  currentStepIndex,
  savedStepData,
  completedSteps
});

// Load on mount
const restored = loadSessionState(problemSlug);

// Clear session
clearSessionState(problemSlug);
```

### Error Handling

**Graceful Fallbacks:**

1. **localStorage Unavailable** (private browsing, disabled)
   - Feature silently disabled
   - Warning logged to console
   - Practice continues normally (just no persistence)

2. **Quota Exceeded**
   - Old sessions automatically cleared
   - Current session prioritized
   - User notified if save fails

3. **Corrupted Data**
   - Invalid state detected
   - Session cleared automatically
   - Fresh start initiated
   - Error logged for debugging

4. **Version Mismatch**
   - Storage key includes version number (`v1`)
   - Future updates can migrate or invalidate old data

### Browser Compatibility

✅ **Fully Supported:**
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+
- Opera 76+

⚠️ **Limitations:**
- Private/Incognito mode: localStorage cleared on close
- iOS Safari: Reduced quota in some cases
- Older browsers: May not support all features

## Privacy & Security

### What's Private

✅ **Draft buffer stays local** — Unsubmitted in-progress UI state in localStorage never leaves your browser  
✅ **Account progress is yours** — Logged-in submissions and sessions are stored securely server-side  
✅ **No sharing** — Sessions can't be transferred between devices without signing in  

### What's Shared

❌ Draft localStorage is not synced across devices. Sign in to persist completed work in the cloud.

### Data Retention

- **User Control**: Clear anytime with "Clear" button
- **Browser Control**: Clearing browser data removes sessions
- **No Expiration**: Sessions persist indefinitely until cleared

## Troubleshooting

### Session Not Restoring?

**Check:**
1. Are you using the same browser?
2. Is localStorage enabled? (Check browser settings)
3. Did you clear browser data recently?
4. Are you in private/incognito mode?

**Fix:**
- Use normal browsing mode
- Check browser localStorage settings
- Look for console errors (F12 → Console tab)

### "Session saved" Not Appearing?

**This is normal!** The footer message only appears **after** you complete at least one step. Until then, there's nothing to save.

### Storage Quota Error?

**Rare, but if it happens:**
1. Export important sessions as PDFs
2. Clear old sessions (navigate to old problems and use "Clear" button)
3. Or clear browser localStorage entirely

**To check usage:**
- Open console (F12)
- Type: `localStorage.length`
- Remove old entries starting with `sd-practice-`

### Data Looks Corrupted?

**Symptoms:**
- Wrong phase/step on load
- Missing answers
- Blank screens

**Fix:**
1. Click "🔄 Clear" button
2. Or manually clear: `localStorage.removeItem('sd-practice-v1-problem-slug')`
3. Refresh page

## Best Practices

### ✅ Do's

- **Complete steps properly**: Only "acceptable" feedback is saved as complete
- **Review restored sessions**: Check the restoration banner to confirm what was loaded
- **Export regularly**: Use PDF export for long-term records
- **Use one browser**: For consistent experience during multi-day practice

### ❌ Don'ts

- **Don't rely on it forever**: Export important sessions as PDFs
- **Don't use private mode**: For serious practice (sessions won't persist)
- **Don't share devices**: Each browser has its own storage
- **Don't clear browser data**: Unless you want to lose sessions

## Future Enhancements

Planned improvements:

- [ ] **Session Dashboard**: View all saved sessions on home page
- [ ] **Manual Sync**: Optional cloud backup (with accounts)
- [ ] **Session Export/Import**: Transfer between devices via file
- [ ] **Version Migration**: Automatic upgrade of old session formats
- [ ] **Session Comparison**: Compare attempts on same problem
- [ ] **Partial Restore**: Choose which parts of a session to restore

## FAQ

**Q: Can I access my session on a different device?**  
A: Sign in—completed progress is stored in your account. The localStorage draft buffer is still per-browser only.

**Q: Does localStorage sync to the cloud when I'm logged in?**  
A: No. Logged-in users rely on the database for submissions and session history. localStorage is only a draft buffer for the current browser tab.

**Q: How long are sessions kept?**  
A: Forever, until you clear them or clear browser data.

**Q: Can I save multiple attempts on the same problem?**  
A: Currently, only the latest attempt is saved. Export older attempts as PDFs first.

**Q: What if I want to compare two approaches?**  
A: Export PDF of first approach, clear session, try second approach, export again.

**Q: Does this work offline?**  
A: Reading saved sessions works offline. AI evaluation requires internet.

**Q: Is there a storage limit?**  
A: Browsers typically allow 5-10 MB for localStorage. You can store ~50-100 sessions.

**Q: Can I disable auto-save?**  
A: Not currently. It's always on for convenience. Just use "Clear" if you want fresh starts.

**Q: What happens if I complete the same step twice?**  
A: The latest completion overwrites the previous one.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│  SESSION PERSISTENCE QUICK GUIDE                │
├─────────────────────────────────────────────────┤
│                                                 │
│  💾 AUTO-SAVE                                   │
│  • Triggered after every step completion        │
│  • No action needed from you                    │
│  • Data stored in browser localStorage          │
│                                                 │
│  🔄 AUTO-RESTORE                                │
│  • Happens automatically on page load           │
│  • Green banner confirms restoration            │
│  • Exact state preserved                        │
│                                                 │
│  🗑️ CLEAR SESSION                              │
│  • Click "Clear" button in step header          │
│  • Requires confirmation                        │
│  • Cannot be undone!                            │
│                                                 │
│  📄 EXPORT PDF                                  │
│  • Click "Export PDF" in main header            │
│  • Downloads complete session                   │
│  • Best practice before clearing                │
│                                                 │
│  ℹ️ CHECK STATUS                                │
│  • Look at footer: "💾 Session auto-saved"     │
│  • Shows step count and storage used            │
│  • Only appears after first completion          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

**Ready to practice?** Your work is now protected! Focus on learning—we'll handle the saving. 🚀
