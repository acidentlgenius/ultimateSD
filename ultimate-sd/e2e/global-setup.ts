import { config as loadEnv } from 'dotenv';
import {
  seedE2eUser,
  seedE2eAdminUser,
  resetE2eFeatureFlags,
} from '../scripts/seed-e2e';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });

async function globalSetup() {
  try {
    await resetE2eFeatureFlags();
    await seedE2eUser({ resetProgress: true });
    await seedE2eAdminUser();
  } catch (e) {
    console.warn("Could not execute globalSetup database resets", e)
  }
}

export default globalSetup;
