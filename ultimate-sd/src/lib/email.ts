import { Resend } from 'resend';

export class EmailConfigurationError extends Error {
    constructor(message = 'Email is not configured') {
        super(message);
        this.name = 'EmailConfigurationError';
    }
}

export const EMAIL_VERIFY_PREFIX = 'email-verify:';

function getAppUrl(): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        throw new EmailConfigurationError('NEXT_PUBLIC_APP_URL is not set');
    }
    return appUrl.replace(/\/$/, '');
}

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
        getAppUrl();
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

export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${getAppUrl()}/api/auth/verify-email?token=${token}`;

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
    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

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
