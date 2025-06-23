// src/lib/middleware/user-setup.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function ensureUserSetup(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if user exists and is properly set up
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        categories: { take: 1 },
        subscription: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please sign out and sign in again." },
        { status: 404 }
      )
    }

    // Check if user needs setup
    const needsSetup = !user.categories.length || !user.subscription

    if (needsSetup) {
      // Trigger setup automatically
      try {
        await setupNewUser(user.id)
      } catch (setupError) {
        console.error('Auto-setup failed:', setupError)
        return NextResponse.json(
          { 
            error: "User setup incomplete. Please complete your profile setup.",
            needsSetup: true,
            setupUrl: "/api/setup-user"
          },
          { status: 412 } // Precondition Failed
        )
      }
    }

    return null // Setup is complete, continue with request
  } catch (error) {
    console.error('User setup verification error:', error)
    return NextResponse.json(
      { error: "Setup verification failed" },
      { status: 500 }
    )
  }
}

async function setupNewUser(userId: string) {
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

  // Create categories if they don't exist
  const existingCategories = await prisma.category.count({
    where: { userId }
  })

  if (existingCategories === 0) {
    await prisma.category.createMany({
      data: defaultCategories.map(category => ({
        ...category,
        userId
      }))
    })
  }

  // Create subscription if it doesn't exist
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId }
  })

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        userId,
        plan: 'FREE',
        status: 'active'
      }
    })
  }

  // Create notification preferences if they don't exist
  const existingPreferences = await prisma.notificationPreference.findUnique({
    where: { userId }
  })

  if (!existingPreferences) {
    await prisma.notificationPreference.create({
      data: {
        userId,
        budgetAlerts: true,
        budgetThreshold: 80,
        dailyDigest: false,
        weeklyReport: true,
        expenseReminders: true,
        emailAlerts: true,
        pushAlerts: false,
      }
    })
  }
}