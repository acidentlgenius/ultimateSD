
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-expect-error adapter types clash due to missing session fields
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });
        if (!user || !user.password) {
          throw new Error("User not found");
        }
        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }
        return user;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
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
          }
        });
        if (dbUser) {
          token.xp = dbUser.xp;
          token.level = dbUser.level;
          token.streak = dbUser.streak;
          token.planType = dbUser.planType;
          token.planExpiresAt = dbUser.planExpiresAt;
          token.aiCredits = dbUser.aiCredits;
          token.geminiApiKey = dbUser.geminiApiKey;
          token.xaiApiKey = dbUser.xaiApiKey;
          token.openaiApiKey = dbUser.openaiApiKey;
          token.anthropicApiKey = dbUser.anthropicApiKey;
          token.azureOpenaiApiKey = dbUser.azureOpenaiApiKey;
          token.azureOpenaiEndpoint = dbUser.azureOpenaiEndpoint;
          token.awsBedrockRegion = dbUser.awsBedrockRegion;
          token.awsBedrockAccessKey = dbUser.awsBedrockAccessKey;
          token.awsBedrockSecretKey = dbUser.awsBedrockSecretKey;
          token.ollamaEndpoint = dbUser.ollamaEndpoint;
          token.ollamaModel = dbUser.ollamaModel;
          token.preferredProvider = dbUser.preferredProvider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.xp = token.xp as number;
        session.user.level = token.level as number;
        session.user.streak = token.streak as number;
        session.user.planType = token.planType as any;
        session.user.planExpiresAt = token.planExpiresAt as any;
        session.user.aiCredits = token.aiCredits as number;
        (session.user as any).preferredProvider = token.preferredProvider as string;
        // Never expose keys to client
      }
      return session;
    }
  }
});
