import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Initialize user with default categories on first sign-in
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { categories: true }
        })

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              categories: {
                create: defaultCategories
              }
            }
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Default expense categories for Indian users
const defaultCategories = [
  { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B", isDefault: true },
  { name: "Transportation", icon: "🚗", color: "#4ECDC4", isDefault: true },
  { name: "Shopping", icon: "🛍️", color: "#45B7D1", isDefault: true },
  { name: "Bills & Utilities", icon: "💡", color: "#96CEB4", isDefault: true },
  { name: "Entertainment", icon: "🎬", color: "#FECA57", isDefault: true },
  { name: "Healthcare", icon: "🏥", color: "#FF9FF3", isDefault: true },
  { name: "Education", icon: "📚", color: "#54A0FF", isDefault: true },
  { name: "Personal Care", icon: "💅", color: "#A29BFE", isDefault: true },
  { name: "Groceries", icon: "🛒", color: "#FD79A8", isDefault: true },
  { name: "EMI", icon: "🏦", color: "#636E72", isDefault: true },
  { name: "Investments", icon: "📈", color: "#00B894", isDefault: true },
  { name: "Others", icon: "📋", color: "#B2BEC3", isDefault: true },
]