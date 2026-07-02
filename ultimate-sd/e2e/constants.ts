import path from 'path';

export const E2E_TEST_EMAIL =
  process.env.E2E_TEST_EMAIL ?? 'test@e2e.sysdesignai.local';
export const E2E_TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD ?? 'E2eTestPassword123!';

export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL ?? 'admin@e2e.sysdesignai.local';
export const E2E_ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? 'E2eAdminPassword123!';

export const AUTH_DIR = path.join(process.cwd(), 'e2e', '.auth');
export const USER_AUTH_FILE = path.join(AUTH_DIR, 'user.json');
export const ADMIN_AUTH_FILE = path.join(AUTH_DIR, 'admin.json');
