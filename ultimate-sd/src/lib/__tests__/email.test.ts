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

  it('mentions automatic AI lucky draw entry for launch platform claims', () => {
    const html = formatPlanWelcomeEmailHtml({
      name: 'Alex',
      planLabel: 'Platform',
      planDescription: 'full access to all practice problems on the platform',
      expiresAt: new Date('2026-09-29T00:00:00.000Z'),
      context: 'launch_platform_claim',
    });

    const normalized = html.replace(/\s+/g, ' ');
    expect(normalized).toContain('automatically entered into our lucky draw');
    expect(normalized).toContain('free AI plans');
    expect(normalized).toContain('no further action is needed');
  });

  it('celebrates AI lucky draw win for launch winners', () => {
    const html = formatPlanWelcomeEmailHtml({
      name: 'Alex',
      planLabel: 'AI',
      planDescription: 'full access to all practice problems plus monthly AI credits',
      expiresAt: new Date('2026-09-29T00:00:00.000Z'),
      context: 'launch_ai_draw_win',
    });

    expect(html).toContain('You won the AI plan lucky draw!');
    expect(html).toContain('selected as one of');
    expect(html).toContain('5');
    expect(html).toContain('upgraded');
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

  it('uses lucky draw subject for AI draw winners', async () => {
    await sendPlanWelcomeEmail({
      email: 'user@example.com',
      name: 'Alex',
      planType: 'ai',
      expiresAt: new Date('2026-09-29T00:00:00.000Z'),
      context: 'launch_ai_draw_win',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Congratulations — you won the AI plan lucky draw!',
      })
    );
  });
});
