import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { EmailConfigurationError, sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        let { email } = await req.json();
        if (email) email = email.toLowerCase();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            return NextResponse.json(
                { message: "If an account with that email exists, we sent a password reset link." },
                { status: 200 }
            );
        }

        const token = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        await prisma.verificationToken.deleteMany({
            where: { identifier: email },
        });

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires,
            },
        });

        await sendPasswordResetEmail(email, token);

        return NextResponse.json(
            { message: "If an account with that email exists, we sent a password reset link." },
            { status: 200 }
        );
    } catch (error) {
        if (error instanceof EmailConfigurationError) {
            console.error("Forgot password email config error:", error.message);
            return NextResponse.json(
                { message: "Email service is not configured. Please contact support." },
                { status: 503 }
            );
        }

        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "An error occurred while processing your request" },
            { status: 500 }
        );
    }
}
