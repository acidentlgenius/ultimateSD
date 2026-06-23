import { type User } from "next-auth"
import { type DefaultSession } from "next-auth"
import { type PlanType } from "@/lib/plans"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            xp: number
            level: number
            streak: number
            planType: PlanType
            hasActivePlan: boolean
            hasPlatformPlan: boolean
            hasAiPlan: boolean
            hasGeminiKey: boolean
            hasXaiKey: boolean
            hasOpenaiKey: boolean
            hasAnthropicKey: boolean
            hasAzureOpenaiKey: boolean
            hasAwsBedrockKey: boolean
            hasOllamaEndpoint: boolean
            aiCredits: number
            preferredProvider: string
            planExpiresAt: string | null
            role?: string
        } & DefaultSession["user"]
    }

    interface User {
        xp: number
        level: number
        streak: number
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        xp: number
        level: number
        streak: number
        planType: PlanType
        hasActivePlan: boolean
        hasPlatformPlan: boolean
        hasAiPlan: boolean
        hasGeminiKey: boolean
        hasXaiKey: boolean
        hasOpenaiKey: boolean
        hasAnthropicKey: boolean
        hasAzureOpenaiKey: boolean
        hasAwsBedrockKey: boolean
        hasOllamaEndpoint: boolean
        aiCredits: number
        preferredProvider: string
        planExpiresAt: string | null
        role?: string
    }
}
