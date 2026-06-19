
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

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

            // Always fetch fresh user data to ensure xp/etc are up to date
            if (token.id) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { xp: true, level: true, streak: true }
                });

                if (freshUser) {
                    token.xp = freshUser.xp ?? 0;
                    token.level = freshUser.level ?? 1;
                    token.streak = freshUser.streak ?? 0;
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
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    }
})
