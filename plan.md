1. **Analyze Backlog/Codebase**:
   - Looking into the codebase, we see a rate limiting TODO for the waitlist action: `src/app/actions/waitlist.ts:6:// TODO: rate-limit before heavy traffic`.
   - The application does not currently have Upstash Redis or any standard rate limiting middleware configured in `package.json`.
   - Next.js server actions are unprotected against abusive automated submissions.

2. **Feature Conceptualization**:
   - Add `@upstash/ratelimit` and `@upstash/redis` to handle rate-limiting.
   - Implement rate-limiting for the `joinWaitlist` server action (`src/app/actions/waitlist.ts`).
   - Create a reusable `rateLimiter` utility to protect other sensitive endpoints (like authentication, AI routes, etc.) in the future.

3. **Implementation**:
   - Install dependencies: `pnpm add @upstash/ratelimit @upstash/redis`
   - Modify `src/app/actions/waitlist.ts` to include rate limiting based on the user's IP.
   - For a server action, `headers()` from `next/headers` can be used to get the user's IP or a fallback like `x-forwarded-for` or `127.0.0.1`.
   - Setup a `lib/ratelimit.ts` utility file.
   - Mock rate limiter for testing in `src/lib/__tests__/waitlist.test.ts`.

4. **Refactoring & Testing**:
   - Run tests: `pnpm test run`.
   - Ensure the new Upstash dependencies are conditionally loaded or mocked properly so builds in CI (where UPSTASH vars might be missing) do not fail, according to the memory rule: "When initializing `@upstash/redis` for rate-limiting, conditionally instantiate it (e.g., checking if `process.env.UPSTASH_REDIS_REST_URL` exists) to prevent application crashes during build steps where environment variables may be absent."

5. **Reporting**:
   - Generate `report.json` as specified.
