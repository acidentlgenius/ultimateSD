import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // We don't want to reveal if a user exists or not for security reasons
        if (!user || !user.password) {
            return NextResponse.json(
                { message: "If an account with that email exists, we sent a password reset link." },
                { status: 200 }
            );
        }

        const token = uuidv4();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

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
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "An error occurred while processing your request" },
            { status: 500 }
        );
    }
}
