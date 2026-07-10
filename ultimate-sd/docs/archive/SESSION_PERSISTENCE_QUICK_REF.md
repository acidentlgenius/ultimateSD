# Session Persistence - Quick Reference Card

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║              🎯 SESSION PERSISTENCE QUICK REFERENCE                  ║
║                   SysDesignAI Practice Platform                      ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  WHAT IT DOES                                                        ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  ✅ Auto-saves your practice progress every step                    ║
║  ✅ Restores session after refresh, close, or crash                 ║
║  ✅ Tracks multiple problems independently                           ║
║  ✅ Works 100% offline (stored in browser)                           ║
║  ✅ No login or account required                                     ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  VISUAL INDICATORS                                                   ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  🟢 GREEN BANNER (top)                                               ║
║     "Session Restored!"                                              ║
║     → Appears when you return after refresh/close                    ║
║     → Shows last save date/time                                      ║
║     → Auto-hides after 5 seconds                                     ║
║                                                                      ║
║  🔄 CLEAR BUTTON (step header)                                       ║
║     "🔄 Clear"                                                       ║
║     → Only visible when you have saved progress                      ║
║     → Click to start fresh (requires confirmation)                   ║
║     → Cannot be undone!                                              ║
║                                                                      ║
║  💾 SESSION INFO (footer)                                            ║
║     "💾 Session auto-saved • 8 steps • 42.5 KB"                     ║
║     → Shows after first step completion                              ║
║     → Displays step count and storage used                           ║
║     → Confirms auto-save is working                                  ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  WHAT GETS SAVED                                                     ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  For each problem you practice:                                      ║
║                                                                      ║
║  📍 Current phase (Requirements, HLD, LLD, etc.)                     ║
║  📍 Current step number within phase                                 ║
║  📍 All your answers (lists, text, schemas)                          ║
║  📍 AI feedback (scores, strengths, weaknesses)                      ║
║  📍 Completion status for each step                                  ║
║  📍 Progress indicators and timestamps                               ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  COMMON SCENARIOS                                                    ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  📱 ACCIDENTAL REFRESH                                               ║
║     → Just refresh! All progress restored instantly.                 ║
║                                                                      ║
║  🚪 CLOSE TAB / BROWSER                                              ║
║     → Come back anytime. Session persists.                           ║
║                                                                      ║
║  💥 BROWSER CRASH                                                    ║
║     → Reopen and navigate back. Everything safe.                     ║
║                                                                      ║
║  🌙 CONTINUE TOMORROW                                                ║
║     → Close today, resume tomorrow. No problem!                      ║
║                                                                      ║
║  🔀 SWITCH PROBLEMS                                                  ║
║     → Practice multiple problems. Each saves independently.          ║
║                                                                      ║
║  🔄 START OVER                                                       ║
║     → Click "🔄 Clear" button → Confirm → Fresh start               ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  STORAGE DETAILS                                                     ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  WHERE:  Browser localStorage (local to your device)                ║
║  SIZE:   ~20-50 KB per session (typical)                             ║
║  LIMIT:  ~5-10 MB total (50-100 sessions)                            ║
║  SCOPE:  Per problem (isolated storage)                              ║
║  PRIVACY: 100% local—never sent to servers                           ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  KEYBOARD SHORTCUTS                                                  ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  Enter         → Add list item (in list inputs)                      ║
║  Cmd/Ctrl+R    → Refresh (session auto-restores)                     ║
║  Cmd/Ctrl+W    → Close tab (session persists)                        ║
║  Esc           → Dismiss restoration banner                          ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  BEST PRACTICES                                                      ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  ✅ DO                                                               ║
║     • Complete steps properly (get "acceptable" feedback)            ║
║     • Review restoration banner to confirm what loaded               ║
║     • Export PDFs regularly for long-term records                    ║
║     • Use one browser per device for consistency                     ║
║                                                                      ║
║  ❌ DON'T                                                            ║
║     • Use private/incognito mode for serious practice                ║
║     • Clear browser data (loses all sessions)                        ║
║     • Rely on it forever (export important work)                     ║
║     • Share devices (storage is per-browser)                         ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  TROUBLESHOOTING                                                     ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  ❓ SESSION NOT RESTORING?                                           ║
║     → Check: Same browser? localStorage enabled?                     ║
║     → Fix: Exit private mode, check browser settings                 ║
║                                                                      ║
║  ❓ "SESSION SAVED" NOT SHOWING?                                     ║
║     → Normal! Only appears after first step completion               ║
║     → Complete at least one step first                               ║
║                                                                      ║
║  ❓ STORAGE QUOTA ERROR?                                             ║
║     → Export old sessions as PDFs                                    ║
║     → Clear old sessions using "🔄 Clear" button                    ║
║     → Or clear browser localStorage                                  ║
║                                                                      ║
║  ❓ DATA LOOKS WRONG?                                                ║
║     → Click "🔄 Clear" to reset                                     ║
║     → Or manually clear in browser console                           ║
║     → Refresh page                                                   ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  CLEAR SESSION WORKFLOW                                              ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║   1. (Optional) Export PDF for records                               ║
║                                                                      ║
║   2. Click "🔄 Clear" button in step header                         ║
║                                                                      ║
║   3. Confirm in dialog:                                              ║
║      "Are you sure? This cannot be undone."                          ║
║                                                                      ║
║   4. All progress deleted                                            ║
║                                                                      ║
║   5. Start fresh at Requirements, Step 1                             ║
║                                                                      ║
║   ⚠️  WARNING: Cannot undo! Export PDF first if needed.             ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  MANUAL STORAGE INSPECTION (Advanced)                                ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  Open browser console (F12 or Cmd+Opt+J) and type:                  ║
║                                                                      ║
║  // View all sessions                                                ║
║  Object.keys(localStorage).filter(k =>                               ║
║    k.startsWith('sd-practice-'))                                     ║
║                                                                      ║
║  // Check size                                                       ║
║  JSON.stringify(localStorage).length                                 ║
║                                                                      ║
║  // View specific session                                            ║
║  JSON.parse(localStorage.getItem(                                    ║
║    'sd-practice-v1-design-tinyurl'))                                 ║
║                                                                      ║
║  // Clear specific session                                           ║
║  localStorage.removeItem('sd-practice-v1-design-tinyurl')            ║
║                                                                      ║
║  // Clear ALL sessions                                               ║
║  Object.keys(localStorage).filter(k =>                               ║
║    k.startsWith('sd-practice-')).forEach(k =>                        ║
║    localStorage.removeItem(k))                                       ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  BROWSER COMPATIBILITY                                               ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  ✅ Chrome / Edge 90+                                                ║
║  ✅ Firefox 90+                                                      ║
║  ✅ Safari 14+                                                       ║
║  ✅ Opera 76+                                                        ║
║                                                                      ║
║  ⚠️  Private/Incognito: Storage cleared on close                    ║
║  ⚠️  iOS Safari: Reduced quota in some cases                        ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  FAQ                                                                 ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  Q: Can I access on different device?                                ║
║  A: No. localStorage is per-device. Export PDF to transfer.          ║
║                                                                      ║
║  Q: How long are sessions kept?                                      ║
║  A: Forever, until you clear them or clear browser data.             ║
║                                                                      ║
║  Q: Can I save multiple attempts on same problem?                    ║
║  A: No. Latest overwrites. Export PDF of first attempt first.        ║
║                                                                      ║
║  Q: Does this work offline?                                          ║
║  A: Reading saves: yes. AI evaluation: needs internet.               ║
║                                                                      ║
║  Q: Can I disable auto-save?                                         ║
║  A: No, it's always on. Use "Clear" for fresh starts.                ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  💡 PRO TIPS                                                         ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  1. Export PDFs after major milestones (not just at end)             ║
║  2. Practice different approaches by clearing and retrying           ║
║  3. Use "Progress History" section to jump to any step               ║
║  4. Check footer to confirm auto-save is working                     ║
║  5. Use same browser for multi-day practice sessions                 ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  📞 NEED HELP?                                                       ║
║  ────────────────────────────────────────────────────────────────   ║
║                                                                      ║
║  Documentation: SESSION_PERSISTENCE.md                               ║
║  Visual Guide:  SESSION_PERSISTENCE_VISUAL_DEMO.md                   ║
║  Technical:     SESSION_PERSISTENCE_SUMMARY.md                       ║
║  GitHub Issues: [Your repo URL]                                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│                        💾 REMEMBER                                   │
│                                                                      │
│  Your practice progress is AUTOMATICALLY SAVED!                      │
│                                                                      │
│  Focus on learning—we handle the persistence.                        │
│                                                                      │
│  Refresh freely. Close tabs. Come back tomorrow.                     │
│  Your work is protected. 🛡️                                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

**Print this card for quick reference while practicing! 📄**
