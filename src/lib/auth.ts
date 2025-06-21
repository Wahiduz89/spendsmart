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
      if (session?.user && token?.sub) {
        session.user.id = token.sub
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
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { 
              categories: true,
              subscription: true 
            }
          })

          if (!existingUser) {
            // Create new user with default setup
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                categories: {
                  create: defaultCategories
                },
                subscription: {
                  create: {
                    plan: 'FREE',
                    status: 'active'
                  }
                }
              }
            })
            console.log(`New user created: ${user.email}`)
          } else {
            // Update existing user info if needed
            if (existingUser.name !== user.name || existingUser.image !== user.image) {
              await prisma.user.update({
                where: { email: user.email! },
                data: {
                  name: user.name,
                  image: user.image
                }
              })
            }
            console.log(`Existing user signed in: ${user.email}`)
          }
        }
        return true
      } catch (error) {
        console.error("Error during sign in:", error)
        // Return false to display an error page
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin", // Error code passed in query string as ?error=
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