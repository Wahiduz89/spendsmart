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
    async session({ session, token, user }) {
      // Ensure session has user ID for database queries
      if (session?.user && user?.id) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Persist user ID in token
      if (user) {
        token.uid = user.id
      }
      return token
    },
    // Remove the conflicting signIn callback - let PrismaAdapter handle it
    // Instead, use the user creation event
  },
  events: {
    async createUser({ user }) {
      try {
        // Create default categories when a new user is created
        await prisma.category.createMany({
          data: defaultCategories.map(category => ({
            ...category,
            userId: user.id
          }))
        })

        // Create default subscription
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'FREE',
            status: 'active'
          }
        })

        console.log(`Default setup completed for new user: ${user.email}`)
      } catch (error) {
        console.error("Error setting up new user:", error)
      }
    }
  },
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
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