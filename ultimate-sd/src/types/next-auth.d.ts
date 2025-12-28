import { type DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            xp: number
            level: number
            streak: number
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
    }
}
