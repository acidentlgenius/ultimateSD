cd ultimate-sd
DATABASE_URL="postgresql://test:test@localhost:5432/test" AUTH_SECRET="testsecret" AUTH_TRUST_HOST="true" pnpm playwright test e2e/auth.spec.ts --project=chromium --debug
