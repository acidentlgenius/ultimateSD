cd ultimate-sd
DATABASE_URL="postgresql://test:test@localhost:5432/test" AUTH_SECRET="testsecret" AUTH_TRUST_HOST="true" pnpm playwright test e2e/roadmap.spec.ts e2e/auth.spec.ts e2e/ai-failures.spec.ts
