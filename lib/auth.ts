import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { loginRateLimiter } from "./rate-limit"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Rate limiting: 5 login attempts per 15 minutes
        const { success, reset } = await loginRateLimiter.limit(credentials.email)
        if (!success) {
          const minutesLeft = Math.ceil((reset - Date.now()) / 60000)
          throw new Error(`Çok fazla giriş denemesi yaptınız. ${minutesLeft} dakika sonra tekrar deneyin.`)
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            playerProfile: true,
          },
        })

        if (!user || !user.password_hash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        if (!isPasswordValid) {
          return null
        }

        // Check if banned
        if (user.isBanned) {
          if (user.bannedUntil && new Date() < user.bannedUntil) {
            throw new Error(`You are banned until ${user.bannedUntil.toLocaleDateString()}`)
          } else if (!user.bannedUntil) {
            throw new Error("Your account has been permanently banned")
          }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.playerProfile?.nickname || user.email,
          image: null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }

      // Handle Discord OAuth
      if (account?.provider === "discord" && profile) {
        const discordProfile = profile as any

        // Check for existing user
        const existingUser = await prisma.user.findFirst({
          where: {
            socialAccounts: {
              some: {
                provider: "discord",
                providerUserId: discordProfile.id,
              },
            },
          },
        })

        if (existingUser) {
          // Check if banned
          if (existingUser.isBanned) {
            if (existingUser.bannedUntil && new Date() < existingUser.bannedUntil) {
              throw new Error(`You are banned until ${existingUser.bannedUntil.toLocaleDateString()}`)
            } else if (!existingUser.bannedUntil) {
              throw new Error("Your account has been permanently banned")
            }
          }

          token.id = existingUser.id
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
