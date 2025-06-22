import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: "Not authenticated",
        message: "Please sign in first"
      }, { status: 401 })
    }

    // Find user by email since ID might not be in session yet
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        categories: true,
        subscription: true,
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: "User not found in database",
        message: "Please try signing out and signing in again"
      }, { status: 404 })
    }

    const results = {
      userId: user.id,
      email: user.email,
      categoriesCreated: 0,
      subscriptionCreated: false,
      sampleExpensesCreated: 0,
    }

    // Check if user already has categories
    if (user.categories.length === 0) {
      console.log(`Creating default categories for ${user.email}...`)
      
      // Create default categories
      await prisma.category.createMany({
        data: defaultCategories.map(category => ({
          ...category,
          userId: user.id
        }))
      })
      
      results.categoriesCreated = defaultCategories.length
    }

    // Check if user has subscription
    if (!user.subscription) {
      console.log(`Creating subscription for ${user.email}...`)
      
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'active'
        }
      })
      
      results.subscriptionCreated = true
    }

    // Create sample expenses if requested
    const createSamples = request.nextUrl.searchParams.get('createSamples') === 'true'
    
    if (createSamples) {
      const expenseCount = await prisma.expense.count({
        where: { userId: user.id }
      })

      if (expenseCount === 0) {
        const categories = await prisma.category.findMany({
          where: { userId: user.id }
        })

        const sampleExpenses = [
          {
            description: "Lunch at restaurant",
            amount: 450,
            categoryId: categories.find(c => c.name === "Food & Dining")?.id,
            paymentMethod: "UPI" as const,
            merchant: "Swiggy",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            description: "Uber ride to office",
            amount: 150,
            categoryId: categories.find(c => c.name === "Transportation")?.id,
            paymentMethod: "WALLET" as const,
            merchant: "Uber",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            description: "Grocery shopping",
            amount: 1200,
            categoryId: categories.find(c => c.name === "Groceries")?.id,
            paymentMethod: "DEBIT_CARD" as const,
            merchant: "BigBasket",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            description: "Movie tickets",
            amount: 500,
            categoryId: categories.find(c => c.name === "Entertainment")?.id,
            paymentMethod: "CREDIT_CARD" as const,
            merchant: "PVR Cinemas",
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          },
          {
            description: "Electricity bill",
            amount: 2500,
            categoryId: categories.find(c => c.name === "Bills & Utilities")?.id,
            paymentMethod: "NET_BANKING" as const,
            merchant: "Electricity Bill",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]

        for (const expense of sampleExpenses) {
          if (expense.categoryId) {
            await prisma.expense.create({
              data: {
                ...expense,
                userId: user.id
              }
            })
            results.sampleExpensesCreated++
          }
        }
      }
    }

    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        categories: true,
        subscription: true,
        _count: {
          select: {
            expenses: true,
            budgets: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "User setup completed successfully",
      results,
      currentStatus: {
        categoriesCount: updatedUser?.categories.length || 0,
        hasSubscription: !!updatedUser?.subscription,
        expensesCount: updatedUser?._count.expenses || 0,
        budgetsCount: updatedUser?._count.budgets || 0,
      }
    })
  } catch (error) {
    console.error("Setup API Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}