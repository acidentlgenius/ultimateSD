import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { getNextAiCreditsResetDate } from "@/lib/access"
import { FREE_MONTHLY_CREDITS } from "@/lib/plans"
import {
    EmailConfigurationError,
    sendVerificationEmail,
    verificationIdentifier,
} from "@/lib/email"
import posthog from "@/lib/posthog"

export async function POST(req: Request) {
    try {
        let { name, email, password } = await req.json()
        if (email) email = email.toLowerCase()

        if (!email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                aiCredits: FREE_MONTHLY_CREDITS,
                aiCreditsResetAt: getNextAiCreditsResetDate(),
            },
        })

        posthog.capture({
            distinctId: user.id,
            event: 'user signed up',
            properties: {
                $set: { email: user.email, name: user.name },
                signup_method: 'credentials',
            },
        })

        const identifier = verificationIdentifier(email)
        const token = uuidv4()
        const expires = new Date()
        expires.setHours(expires.getHours() + 24)

        await prisma.verificationToken.create({
            data: { identifier, token, expires },
        })

        try {
            await sendVerificationEmail(email, token)
        } catch (error) {
            await prisma.verificationToken.delete({
                where: { identifier_token: { identifier, token } },
            }).catch(() => undefined);

            if (error instanceof EmailConfigurationError) {
                console.error("Signup verification email config error:", error.message)
                return NextResponse.json(
                    {
                        message: "Account created but email service is not configured. Contact support to verify your account.",
                        emailSent: false,
                        user: { id: user.id, email: user.email, name: user.name },
                    },
                    { status: 201 }
                )
            }

            console.error("Signup verification email error:", error)
            return NextResponse.json(
                {
                    message: "Account created but we couldn't send the verification email. You can request a new link from the login page.",
                    emailSent: false,
                    user: { id: user.id, email: user.email, name: user.name },
                },
                { status: 201 }
            )
        }

        return NextResponse.json(
            {
                message: "Check your email to verify your account before signing in.",
                emailSent: true,
                user: { id: user.id, email: user.email, name: user.name },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
