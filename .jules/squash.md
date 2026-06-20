## $(date +%Y-%m-%d) - [Silent Loop Failure via LocalStorage Parsing Error]

**Learning:** When iterating over a collection (like `localStorage` keys) and parsing their contents, wrapping the *entire* loop in a `try/catch` block creates a severe vulnerability: a single corrupted item will throw an error, abort the entire loop, and silently hide all subsequent valid items. In `getAllSessions`, this meant one corrupt session key made the system report *zero* total sessions for a user, effectively wiping their history until the bad key was manually cleared.

**Action:** Always scope `try/catch` blocks tightly around the risky operation *inside* the iteration, rather than wrapping the whole loop. When catching parsing errors for stored user state, proactively remove the corrupted key (`localStorage.removeItem`) so the system can self-heal, rather than repeatedly failing on the same bad data.
