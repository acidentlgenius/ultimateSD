import { config as loadEnv } from 'dotenv';
import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';
import { fakeMediaRecorder, mockVoiceRoutes } from './helpers/voice-mocks';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });

test.describe.configure({ mode: 'serial' });

test.describe('voice interview (flag granted, audio providers mocked)', () => {
  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
  });
  test.beforeAll(async () => {
    await grantFlagToE2eUser('voiceInterview');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('voiceInterview');
  });

  test('completes a full push-to-talk turn', async ({ page }) => {
    await fakeMediaRecorder(page);
    await mockVoiceRoutes(page);

    await page.goto('/practice/design-tinyurl');
    await page.getByRole('switch', { name: /practice aloud/i }).click();
    await page.getByTestId('voice-start').click();

    // Opening interviewer question appears in the transcript.
    const transcript = page.getByTestId('voice-transcript');
    await expect(transcript).toContainText('What are the core requirements?');

    // Push-to-talk: press, release → candidate transcript → interviewer reply.
    const talk = page.getByTestId('voice-talk');
    await expect(talk).toBeEnabled();
    await talk.dispatchEvent('pointerdown');
    await expect(page.getByTestId('voice-status')).toContainText(/listening/i);
    await talk.dispatchEvent('pointerup');

    await expect(transcript).toContainText('I would start with URL shortening and redirects.');
    await expect(transcript).toContainText('How would you handle 100 million redirects a day?');

    // Turn completes back to idle (playback error path counts as ended).
    await expect(page.getByTestId('voice-status')).toContainText(/hold the button/i);
  });

  test('voice panel is hidden without the flag', async ({ page }) => {
    await removeFlagOverrideForE2eUser('voiceInterview');
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByTestId('voice-start')).toHaveCount(0);
    await grantFlagToE2eUser('voiceInterview');
  });
});
