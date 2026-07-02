import { config as loadEnv } from 'dotenv';
import { seedE2eUser, seedE2eAdminUser } from '../scripts/seed-e2e';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });

async function globalSetup() {
  await seedE2eUser({ resetProgress: true });
  await seedE2eAdminUser();
}

export default globalSetup;
