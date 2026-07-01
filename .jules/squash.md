## 2024-05-18 - Case Sensitive Email Authentication Vulnerability

**Learning:** PostgreSQL uses case-sensitive string collation by default. When Prisma's `findUnique` is used with an exact `email` match for user lookups, it can lead to multiple accounts being created for the same user (e.g., `user@example.com` and `User@example.com`). This fragments the authentication state and can cause sign-in failures or unintended session state bleed depending on which record `findFirst` selects during auth.

**Action:** Always replace `findUnique` email lookups with `findFirst` using `{ equals: email, mode: 'insensitive' }` across all authentication and internal user-fetching routes (e.g. signup, auth login, password reset, progress sync).
