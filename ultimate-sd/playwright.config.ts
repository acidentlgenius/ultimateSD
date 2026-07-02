import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
import { ADMIN_AUTH_FILE, USER_AUTH_FILE } from './e2e/constants';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });

const PORT = process.env.PORT ?? '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/sysdesignai_test?schema=public';
const authSecret =
  process.env.AUTH_SECRET ?? 'dev-secret-at-least-32-characters-long';
// Dummy Razorpay credentials so isRazorpayConfigured() is true in e2e — this lets
// /api/orders reach its feature-flag check instead of short-circuiting with 503
// for "payments not configured". No real Razorpay API call happens for a dark
// (flag-gated) plan, since the flag check returns 403 before the client is used.
const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? 'rzp_test_e2e_dummy_key_id';
const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET ?? 'e2e_dummy_key_secret';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'guest',
      testMatch: /(smoke|lifetime-pricing)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      testMatch: /(auth|practice|roadmap|fresher-track|flag-gating)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: USER_AUTH_FILE,
      },
    },
    {
      name: 'admin-setup',
      testMatch: /auth\.admin\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin',
      testMatch: /admin-.*\.spec\.ts/,
      dependencies: ['admin-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_AUTH_FILE,
      },
    },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm build && pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT,
      DATABASE_URL: databaseUrl,
      AUTH_SECRET: authSecret,
      NEXTAUTH_URL: baseURL,
      RAZORPAY_KEY_ID: razorpayKeyId,
      RAZORPAY_KEY_SECRET: razorpayKeySecret,
    },
  },
});
