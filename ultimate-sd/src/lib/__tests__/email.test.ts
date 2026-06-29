import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatPlanWelcomeEmailHtml, sendPlanWelcomeEmail } from '../email';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: sendMock };
  },
}));

describe('formatPlanWelcomeEmailHtml', () => {
  it('includes plan name, expiry, and feedback invitation', () => {
    const expiresAt = new Date('2026-09-29T00:00:00.000Z');
    const html = formatPlanWelcomeEmailHtml({
      name: 'Alex',
      planLabel: 'AI',
      planDescription: 'full access to all practice problems plus monthly AI credits',
      expiresAt,
    });

    expect(html).toContain('Congratulations');
    expect(html).toContain('Alex');
    expect(html).toContain('AI');
    expect(html).toContain('3 months');
    expect(html).toContain('feedback');
    expect(html).toContain('September 29, 2026');
  });
});

describe('sendPlanWelcomeEmail', () => {
  beforeEach(() => {
    sendMock.mockClear();
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.EMAIL_FROM = 'SysDesignAI <noreply@example.com>';
    process.env.NEXT_PUBLIC_APP_URL = 'https://ultimate-sd.vercel.app';
  });

  it('sends with a congratulations subject', async () => {
    await sendPlanWelcomeEmail({
      email: 'user@example.com',
      name: 'Alex',
      planType: 'platform',
      expiresAt: new Date('2026-09-29T00:00:00.000Z'),
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('Congratulations'),
      })
    );
  });
});
