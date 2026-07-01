import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import {
    EmailConfigurationError,
    sendVerificationEmail,
    verificationIdentifier,
} from '@/lib/email';

export async function POST(req: Request) {
    try {
        let { email } = await req.json();
        if (email) email = email.toLowerCase();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });

        if (!user || !user.password || user.emailVerified) {
            return NextResponse.json(
                { message: 'If an unverified account exists for that email, we sent a verification link.' },
                { status: 200 }
            );
        }

        const exactEmail = user.email;

        const identifier = verificationIdentifier(exactEmail);
        const token = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);

        await prisma.verificationToken.deleteMany({
            where: { identifier },
        });

        await prisma.verificationToken.create({
            data: { identifier, token, expires },
        });

        await sendVerificationEmail(exactEmail, token);

        return NextResponse.json(
            { message: 'If an unverified account exists for that email, we sent a verification link.' },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof EmailConfigurationError) {
            console.error('Resend verification email config error:', error.message);
            return NextResponse.json(
                { message: 'Email service is not configured. Please contact support.' },
                { status: 503 }
            );
        }

        console.error('Resend verification error:', error);
        return NextResponse.json(
            { message: 'An error occurred while sending the verification email' },
            { status: 500 }
        );
    }
}
