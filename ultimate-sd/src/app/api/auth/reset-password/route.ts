import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: "Token and new password are required" },
                { status: 400 }
            );
        }

        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                token,
                expires: { gt: new Date() },
            },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { message: "Invalid or expired reset token" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.findFirst({
            where: { email: { equals: verificationToken.identifier, mode: 'insensitive' } }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                emailVerified: new Date(),
            },
        });

        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: verificationToken.identifier,
                    token: token,
                },
            },
        });

        return NextResponse.json(
            { message: "Password reset successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json(
            { message: "An error occurred during password reset" },
            { status: 500 }
        );
    }
}
