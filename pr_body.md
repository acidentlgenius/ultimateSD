fix: Prisma `ECONNREFUSED` build crashes and E2E timeouts

- Wrapped `prisma.launchOfferRedemption.count()` inside a `try...catch` block in `getLaunchOfferStats()` (in `launch-offer-grant.ts`) to prevent Next.js build crashes when the DB is unreachable during static pre-rendering.
- Wrapped `prisma.featureFlag.findUnique()` and `prisma.featureFlag.findMany()` inside `try...catch` blocks in `getFeatureFlagState` and `getAccessibleFeatures` (in `feature-flags-server.ts`) to prevent Next.js build crashes and subsequent E2E timeouts.
- Removed empty objects `{}` from `deleteMany()` calls in `seed-e2e.ts` to prevent Prisma `Invalid invocation` validation errors during the E2E seed step.
