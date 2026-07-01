1. **Identify the bug:** PostgreSQL has case-sensitive collation by default, which can cause sign-in and authentication issues if email lookups are done exactly and cases mismatch (e.g. `user@example.com` vs `User@example.com`).
2. **Current state:** We are using `findUnique` for email lookups which performs exact matches. The memory states: "To prevent sign-in and authentication issues caused by PostgreSQL's case-sensitive collation, always use `findFirst` with `{ equals: email, mode: 'insensitive' }` for email database lookups instead of `findUnique` and `email.toLowerCase()`".
3. **The Fix:** I need to replace `findUnique` with `findFirst` and use `{ equals: email, mode: 'insensitive' }` for all email lookups across the codebase.
4. **Files to modify:**
   - `src/app/api/auth/signup/route.ts`
   - `src/app/api/auth/resend-verification/route.ts`
   - `src/app/api/auth/forgot-password/route.ts`
   - `src/app/actions/progress/submissions.ts`
   - `src/auth.ts`
   - `src/app/actions/gamification.ts`
   - `src/app/profile/page.tsx`
5. **Testing:** Create/update regression tests to ensure case-insensitive email lookups work correctly.
6. **Pre-commit steps:** Follow the pre-commit instructions to ensure everything is solid.
7. **Submit:** Submit PR with proper title and description.
