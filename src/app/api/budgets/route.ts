import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns"

// Validation schema for budget creation
const createBudgetSchema = z.object({
  amount: z.number().positive("Budget amount must be positive"),
  categoryId: z.string().optional().nullable(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().datetime().optional(),
})

// Calculate budget period dates
function getBudgetPeriod(period: string, startDate?: Date) {
  const baseDate = startDate || new Date()
  
  switch (period) {
    case 'WEEKLY':
      return {
        start: startOfWeek(baseDate, { weekStartsOn: 1 }),
        end: endOfWeek(baseDate, { weekStartsOn: 1 })
      }
    case 'MONTHLY':
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate)
      }
    case 'QUARTERLY':
      return {
        start: startOfQuarter(baseDate),
        end: endOfQuarter(baseDate)
      }
    case 'YEARLY':
      return {
        start: startOfYear(baseDate),
        end: endOfYear(baseDate)
      }
    default:
      return {
        start: startOfMonth(baseDate),
        end: endOfMonth(baseDate)
      }
  }
}

// GET: Fetch user budgets with spending data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get("active") === "true"

    const where: any = { userId: session.user.id }
    if (active) {
      where.isActive = true
      where.endDate = { gte: new Date() }
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spendingWhere: any = {
          userId: session.user.id,
          date: {
            gte: budget.startDate,
            lte: budget.endDate
          }
        }

        if (budget.categoryId) {
          spendingWhere.categoryId = budget.categoryId
        }

        const spending = await prisma.expense.aggregate({
          where: spendingWhere,
          _sum: {
            amount: true
          }
        })

        const spent = spending._sum.amount || 0
        const remaining = budget.amount - spent
        const percentageUsed = (spent / budget.amount) * 100

        return {
          ...budget,
          spent,
          remaining,
          percentageUsed: Math.round(percentageUsed)
        }
      })
    )

    return NextResponse.json(budgetsWithSpending)
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    )
  }
}

// POST: Create new budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBudgetSchema.parse(body)

    // Check subscription limits
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    const activeBudgetsCount = await prisma.budget.count({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    const plan = userSubscription?.plan || 'FREE'
    const limit = plan === 'FREE' ? 3 : -1

    if (limit !== -1 && activeBudgetsCount >= limit) {
      return NextResponse.json(
        { error: "Budget limit reached. Please upgrade to Premium." },
        { status: 403 }
      )
    }

    // Calculate budget period
    const period = getBudgetPeriod(
      validatedData.period,
      validatedData.startDate ? new Date(validatedData.startDate) : undefined
    )

    // Check for existing budget in the same period
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        categoryId: validatedData.categoryId,
        period: validatedData.period,
        isActive: true,
        startDate: period.start,
        endDate: period.end
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: "Budget already exists for this period and category" },
        { status: 400 }
      )
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        amount: validatedData.amount,
        categoryId: validatedData.categoryId,
        period: validatedData.period,
        startDate: period.start,
        endDate: period.end,
        userId: session.user.id,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      }
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error creating budget:", error)
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    )
  }
}

// PATCH: Update budget
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const budget = await prisma.budget.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      )
    }

    // Update budget
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        }
      }
    })

    return NextResponse.json(updatedBudget)
  } catch (error) {
    console.error("Error updating budget:", error)
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    )
  }
}

// DELETE: Delete budget
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Budget ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership and delete
    const deletedBudget = await prisma.budget.deleteMany({
      where: { id, userId: session.user.id }
    })

    if (deletedBudget.count === 0) {
      return NextResponse.json(
        { error: "Budget not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Budget deleted successfully" })
  } catch (error) {
    console.error("Error deleting budget:", error)
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    )
  }
}