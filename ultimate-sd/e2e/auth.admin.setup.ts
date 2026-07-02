import { mkdir } from 'fs/promises';
import { test as setup } from '@playwright/test';
import { ADMIN_AUTH_FILE, AUTH_DIR, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from './constants';

setup('authenticate admin user', async ({ page }) => {
  await mkdir(AUTH_DIR, { recursive: true });

  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_ADMIN_EMAIL);
  await page.getByLabel('Password').fill(E2E_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.waitForURL(
    (url) => !url.pathname.startsWith('/login'),
    { timeout: 30_000 },
  );

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
