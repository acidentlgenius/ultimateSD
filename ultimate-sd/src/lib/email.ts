import nodemailer from 'nodemailer';

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

function getTransporter(): nodemailer.Transporter {
    const host = process.env.EMAIL_SERVER_HOST;
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const from = process.env.EMAIL_FROM;

    if (!host || !user || !pass || !from) {
        throw new EmailConfigurationError(
            'Missing EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, or EMAIL_FROM'
        );
    }

    return nodemailer.createTransport({
        host,
        port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
        secure: process.env.EMAIL_SERVER_PORT === '465',
        auth: { user, pass },
    });
}

export function isEmailConfigured(): boolean {
    try {
        getAppUrl();
        getTransporter();
        return true;
    } catch {
        return false;
    }
}

async function sendMail(options: { to: string; subject: string; html: string }) {
    const from = process.env.EMAIL_FROM;
    if (!from) {
        throw new EmailConfigurationError('EMAIL_FROM is not set');
    }

    const transporter = getTransporter();
    await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
}

export async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${getAppUrl()}/api/auth/verify-email?token=${token}`;

    await sendMail({
        to: email,
        subject: 'Verify your email address',
        html: `
            <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
            <p><a href="${verifyUrl}">Verify Email</a></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
        `,
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

    await sendMail({
        to: email,
        subject: 'Reset your password',
        html: `
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `,
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
