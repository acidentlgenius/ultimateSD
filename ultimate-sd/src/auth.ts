
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { toAccessSnapshot, type UserAccess } from "@/lib/access"
import { type PlanType } from "@/lib/plans"

const accessSelect = {
    xp: true,
    level: true,
    streak: true,
    planType: true,
    planExpiresAt: true,
    aiCredits: true,
    geminiApiKey: true,
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
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        Google,
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

                const email = credentials.email as string;

                const user = await prisma.user.findUnique({
                    where: { email },
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
        async jwt({ token, user }) {
            if (user?.id) {
                token.id = user.id;
            } else if (!token.id && token.sub) {
                token.id = token.sub;
            }

            if (token.id) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: accessSelect,
                });

                if (freshUser) {
                    applyAccessToToken(token, freshUser);
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
