💥 The Bug: When using `resolveSessionUserId` to look up a user via their email address from the NextAuth session, the lookup can fail or incorrectly duplicate an account if the email's casing doesn't exactly match the database (e.g. `User@example.com` vs `user@example.com`).

🔍 Root Cause: The function `resolveSessionUserId` was using `findUnique({ where: { email } })` for email lookups. `findUnique` performs a case-sensitive match. In Postgres, string equality is case-sensitive by default unless a `citext` column is used. Since we are using standard `String` columns, `findUnique` will not match case-varied emails.

🛠️ The Fix: Replaced `findUnique` with `findFirst` and used the Prisma `{ equals: email, mode: 'insensitive' }` filter for the email lookup in `resolveSessionUserId` within `src/lib/session-user.ts`.

🛡️ Prevention: Updated `src/lib/__tests__/session-user.test.ts` to assert that `findFirst` is called with the `mode: 'insensitive'` filter. Added a note to Squash's journal to always use `findFirst` with `mode: 'insensitive'` for email lookups to prevent authentication fragmentation.
