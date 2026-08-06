import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailFromVerificationIdentifier } from '@/lib/email';
import { safeCallbackPath } from '@/lib/safe-redirect';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const callbackUrl = safeCallbackPath(url.searchParams.get('callbackUrl'));
    const loginUrl = new URL('/login', req.url);
    if (callbackUrl) {
        loginUrl.searchParams.set('callbackUrl', callbackUrl);
    }

    if (!token) {
        loginUrl.searchParams.set('error', 'invalid_token');
        return NextResponse.redirect(loginUrl);
    }

    try {
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                identifier: { startsWith: 'email-verify:' },
                expires: { gt: new Date() },
            },
        });

        if (!verificationToken) {
            loginUrl.searchParams.set('error', 'invalid_token');
            return NextResponse.redirect(loginUrl);
        }

        const email = emailFromVerificationIdentifier(verificationToken.identifier);
        if (!email) {
            loginUrl.searchParams.set('error', 'invalid_token');
            return NextResponse.redirect(loginUrl);
        }

        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if (!user) {
            loginUrl.searchParams.set('error', 'invalid_token');
            return NextResponse.redirect(loginUrl);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
        });

        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token,
                },
            },
        });

        loginUrl.searchParams.set('verified', '1');
        return NextResponse.redirect(loginUrl);
    } catch (error) {
        console.error('Verify email error:', error);
        loginUrl.searchParams.set('error', 'verification_failed');
        return NextResponse.redirect(loginUrl);
    }
}
