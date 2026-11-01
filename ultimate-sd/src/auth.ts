
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { toAccessSnapshot, type UserAccess } from "@/lib/access"
import { type PlanType } from "@/lib/plans"
import posthog from "@/lib/posthog"

const accessSelect = {
    xp: true,
    level: true,
    streak: true,
    planType: true,
    planExpiresAt: true,
    aiCredits: true,
    geminiApiKey: true,
    deepseekApiKey: true,
    xaiApiKey: true,
    openaiApiKey: true,
    anthropicApiKey: true,
    azureOpenaiApiKey: true,
    azureOpenaiEndpoint: true,
    awsBedrockRegion: true,
    awsBedrockAccessKey: true,
    awsBedrockSecretKey: true,
    ollamaEndpoint: true,
    ollamaModel: true,
    preferredProvider: true,
    role: true,
} as const;

function applyAccessToToken(
    token: import("next-auth/jwt").JWT,
    user: {
        xp: number | null;
        level: number | null;
        streak: number | null;
        planType: string;
        planExpiresAt: Date | null;
        aiCredits: number;
        geminiApiKey: string | null;
        deepseekApiKey: string | null;
        xaiApiKey: string | null;
        openaiApiKey: string | null;
        anthropicApiKey: string | null;
        azureOpenaiApiKey: string | null;
        azureOpenaiEndpoint: string | null;
        awsBedrockRegion: string | null;
        awsBedrockAccessKey: string | null;
        awsBedrockSecretKey: string | null;
        ollamaEndpoint: string | null;
        ollamaModel: string | null;
        preferredProvider: string;
        role: string;
    }
) {
    const access = toAccessSnapshot({
        planType: user.planType as PlanType,
        planExpiresAt: user.planExpiresAt,
        aiCredits: user.aiCredits,
        geminiApiKey: user.geminiApiKey,
        deepseekApiKey: user.deepseekApiKey,
        xaiApiKey: user.xaiApiKey,
        openaiApiKey: user.openaiApiKey,
        anthropicApiKey: user.anthropicApiKey,
        azureOpenaiApiKey: user.azureOpenaiApiKey,
        azureOpenaiEndpoint: user.azureOpenaiEndpoint,
        awsBedrockRegion: user.awsBedrockRegion,
        awsBedrockAccessKey: user.awsBedrockAccessKey,
        awsBedrockSecretKey: user.awsBedrockSecretKey,
        ollamaEndpoint: user.ollamaEndpoint,
        ollamaModel: user.ollamaModel,
        preferredProvider: user.preferredProvider,
    } satisfies UserAccess);

    token.xp = user.xp ?? 0;
    token.level = user.level ?? 1;
    token.streak = user.streak ?? 0;
    token.planType = access.planType;
    token.hasActivePlan = access.hasActivePlan;
    token.hasPlatformPlan = access.hasPlatformPlan;
    token.hasAiPlan = access.hasAiPlan;
    token.hasGeminiKey = access.hasGeminiKey;
    token.hasDeepseekKey = access.hasDeepseekKey;
    token.hasXaiKey = access.hasXaiKey;
    token.hasOpenaiKey = access.hasOpenaiKey;
    token.hasAnthropicKey = access.hasAnthropicKey;
    token.hasAzureOpenaiKey = access.hasAzureOpenaiKey;
    token.hasAwsBedrockKey = access.hasAwsBedrockKey;
    token.hasOllamaEndpoint = access.hasOllamaEndpoint;
    token.aiCredits = access.aiCredits;
    token.preferredProvider = access.preferredProvider;
    token.planExpiresAt = user.planExpiresAt?.toISOString() ?? null;
    token.role = user.role;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: process.env.AUTH_DEBUG === 'true',
    trustHost: true,
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = (credentials.email as string).toLowerCase();

                const user = await prisma.user.findFirst({
                    where: { email: { equals: email, mode: 'insensitive' } },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                if (!user.emailVerified) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    xp: user.xp ?? 0,
                    level: user.level ?? 1,
                    streak: user.streak ?? 0,
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user?.id) {
                token.id = user.id;
                posthog.capture({
                    distinctId: user.id,
                    event: 'user logged in',
                    properties: {
                        $set: { email: user.email, name: user.name },
                        login_method: account?.provider ?? 'credentials',
                    },
                })
            } else if (!token.id && token.sub) {
                token.id = token.sub;
            }

            if (token.id) {
                let freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { id: true, ...accessSelect },
                });

                // After a DB reset/reseed, the JWT can still hold a deleted user id.
                // Re-bind by email so practice sessions and submissions keep working.
                if (!freshUser && typeof token.email === 'string' && token.email) {
                    const byEmail = await prisma.user.findFirst({
                        where: { email: { equals: token.email, mode: 'insensitive' } },
                        select: { id: true, ...accessSelect },
                    });
                    if (byEmail) {
                        token.id = byEmail.id;
                        token.sub = byEmail.id;
                        freshUser = byEmail;
                    }
                }

                if (freshUser) {
                    applyAccessToToken(token, freshUser);
                } else {
                    // Stale cookie with no matching user — force a clean re-login
                    // rather than letting FK writes fail silently.
                    delete token.id;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = (token.id ?? token.sub) as string;
                session.user.xp = token.xp as number;
                session.user.level = token.level as number;
                session.user.streak = token.streak as number;
                session.user.planType = token.planType as PlanType;
                session.user.hasActivePlan = token.hasActivePlan as boolean;
                session.user.hasPlatformPlan = token.hasPlatformPlan as boolean;
                session.user.hasAiPlan = token.hasAiPlan as boolean;
                session.user.hasGeminiKey = token.hasGeminiKey as boolean;
                session.user.hasDeepseekKey = token.hasDeepseekKey as boolean;
                session.user.hasXaiKey = token.hasXaiKey as boolean;
                session.user.hasOpenaiKey = token.hasOpenaiKey as boolean;
                session.user.hasAnthropicKey = token.hasAnthropicKey as boolean;
                session.user.hasAzureOpenaiKey = token.hasAzureOpenaiKey as boolean;
                session.user.hasAwsBedrockKey = token.hasAwsBedrockKey as boolean;
                session.user.hasOllamaEndpoint = token.hasOllamaEndpoint as boolean;
                session.user.aiCredits = token.aiCredits as number;
                session.user.preferredProvider = token.preferredProvider as string;
                session.user.planExpiresAt = token.planExpiresAt as string | null;
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    }
})
