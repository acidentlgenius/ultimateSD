import { Resend } from 'resend';
import { LAUNCH_AI_WINNER_SLOTS } from '@/lib/launch-offer';
import { SITE_URL } from '@/lib/site';
import {
  PLAN_LABELS,
  PLAN_WELCOME_DESCRIPTIONS,
  type PlanType,
} from '@/lib/plans';

export class EmailConfigurationError extends Error {
    constructor(message = 'Email is not configured') {
        super(message);
        this.name = 'EmailConfigurationError';
    }
}

export const EMAIL_VERIFY_PREFIX = 'email-verify:';

function getFromAddress(): string {
    const from = process.env.EMAIL_FROM;
    if (!from) {
        throw new EmailConfigurationError('EMAIL_FROM is not set');
    }
    return from;
}

function getResendClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new EmailConfigurationError('RESEND_API_KEY is not set');
    }
    return new Resend(apiKey);
}

export function isEmailConfigured(): boolean {
    try {
        getFromAddress();
        getResendClient();
        return true;
    } catch {
        return false;
    }
}

async function sendMail(options: { to: string; subject: string; html: string }) {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
        from: getFromAddress(),
        to: options.to,
        subject: options.subject,
        html: options.html,
    });

    if (error) {
        throw new Error(error.message);
    }
}

function authEmailLayout(title: string, body: string, actionLabel: string, actionUrl: string, footer: string) {
    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
            <h1 style="font-size: 22px; margin: 0 0 16px;">${title}</h1>
            ${body}
            <p style="margin: 24px 0;">
                <a href="${actionUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
                    ${actionLabel}
                </a>
            </p>
            <p style="font-size: 13px; color: #6b7280; word-break: break-all;">Or copy this link: ${actionUrl}</p>
            <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">${footer}</p>
        </div>
    `;
}

function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export type PlanWelcomeEmailContext =
  | 'default'
  | 'launch_platform_claim'
  | 'launch_ai_draw_win';

export interface PlanWelcomeEmailParams {
  name: string | null;
  planLabel: string;
  planDescription: string;
  expiresAt: Date;
  context?: PlanWelcomeEmailContext;
}

function formatPlanWelcomeBody(params: PlanWelcomeEmailParams): string {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';
  const expiryFormatted = formatExpiryDate(params.expiresAt);
  const context = params.context ?? 'default';

  if (context === 'launch_ai_draw_win') {
    return `
      <p>${greeting}</p>
      <p>
        Great news — you have been selected as one of
        <strong>${LAUNCH_AI_WINNER_SLOTS}</strong> winners in our launch offer
        AI plan lucky draw!
      </p>
      <p>
        Your account has been upgraded to the
        <strong>${params.planLabel}</strong> plan for the next
        <strong>3 months</strong> (until ${expiryFormatted}).
      </p>
      <p>
        Your plan includes ${params.planDescription}.
        Please feel free to use the platform and share any feedback you have —
        we would love to hear from you.
      </p>
    `;
  }

  const launchDrawNote =
    context === 'launch_platform_claim'
      ? `
      <p>
        As a launch offer claimant, you are automatically entered into our lucky
        draw for <strong>${LAUNCH_AI_WINNER_SLOTS}</strong> free AI plans.
        Winners will be selected at random and notified by email — no further
        action is needed on your part.
      </p>
    `
      : '';

  return `
    <p>${greeting}</p>
    <p>
      Congratulations! You have been given access to the
      <strong>${params.planLabel}</strong> plan for the next
      <strong>3 months</strong> (until ${expiryFormatted}).
    </p>
    ${launchDrawNote}
    <p>
      Your plan includes ${params.planDescription}.
      Please feel free to use the platform and share any feedback you have —
      we would love to hear from you.
    </p>
  `;
}

function formatPlanWelcomeSubject(
  planLabel: string,
  context: PlanWelcomeEmailContext = 'default'
): string {
  if (context === 'launch_ai_draw_win') {
    return 'Congratulations — you won the AI plan lucky draw!';
  }
  return `Congratulations — your ${planLabel} plan is ready`;
}

export function formatPlanWelcomeEmailHtml(params: PlanWelcomeEmailParams): string {
  const dashboardUrl = `${SITE_URL}/`;
  const context = params.context ?? 'default';
  const title =
    context === 'launch_ai_draw_win'
      ? 'You won the AI plan lucky draw!'
      : 'Welcome to Ultimate SD';

  return authEmailLayout(
    title,
    formatPlanWelcomeBody(params),
    'Start Practicing',
    dashboardUrl,
    'If you have questions, reply to this email or contact support.'
  );
}

export async function sendPlanWelcomeEmail(options: {
  email: string;
  name: string | null;
  planType: Exclude<PlanType, 'free'>;
  expiresAt: Date;
  context?: PlanWelcomeEmailContext;
}): Promise<void> {
  const planLabel = PLAN_LABELS[options.planType];
  const planDescription = PLAN_WELCOME_DESCRIPTIONS[options.planType];
  const context = options.context ?? 'default';

  await sendMail({
    to: options.email,
    subject: formatPlanWelcomeSubject(planLabel, context),
    html: formatPlanWelcomeEmailHtml({
      name: options.name,
      planLabel,
      planDescription,
      expiresAt: options.expiresAt,
      context,
    }),
  });
}

export async function sendVerificationEmail(email: string, token: string, callbackUrl?: string | null) {
    // Carry the user's original destination through the verification round-trip
    // so they land back on the problem they were trying to open.
    const callbackParam = callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : '';
    const verifyUrl = `${SITE_URL}/api/auth/verify-email?token=${token}${callbackParam}`;

    await sendMail({
        to: email,
        subject: 'Verify your email address',
        html: authEmailLayout(
            'Verify your email',
            '<p>Thanks for signing up for SysDesignAI. Confirm your email address to activate your account.</p>',
            'Verify Email',
            verifyUrl,
            'If you did not create an account, you can safely ignore this email. This link expires in 24 hours.'
        ),
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${SITE_URL}/reset-password?token=${token}`;

    await sendMail({
        to: email,
        subject: 'Reset your password',
        html: authEmailLayout(
            'Reset your password',
            '<p>We received a request to reset your SysDesignAI password.</p>',
            'Reset Password',
            resetUrl,
            'If you did not request a password reset, you can safely ignore this email. This link expires in 1 hour.'
        ),
    });
}

export function verificationIdentifier(email: string): string {
    return `${EMAIL_VERIFY_PREFIX}${email}`;
}

export function emailFromVerificationIdentifier(identifier: string): string | null {
    if (!identifier.startsWith(EMAIL_VERIFY_PREFIX)) {
        return null;
    }
    return identifier.slice(EMAIL_VERIFY_PREFIX.length);
}
