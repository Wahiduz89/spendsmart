import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Enhanced GET endpoint with search and advanced filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    
    // Search and filters
    const q = searchParams.get("q") // Global search query
    const categoryId = searchParams.get("categoryId") || searchParams.get("category")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const paymentMethod = searchParams.get("paymentMethod")
    const merchant = searchParams.get("merchant")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Build where clause
    const where: any = { userId: session.user.id }
    
    // Global search across description, merchant, and notes
    if (q) {
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { merchant: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ]
    }
    
    // Category filter
    if (categoryId) where.categoryId = categoryId
    
    // Payment method filter
    if (paymentMethod) where.paymentMethod = paymentMethod
    
    // Merchant filter
    if (merchant) {
      where.merchant = { contains: merchant, mode: 'insensitive' }
    }
    
    // Date range filter
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) where.amount.gte = parseFloat(minAmount)
      if (maxAmount) where.amount.lte = parseFloat(maxAmount)
    }

    // Build orderBy clause
    const orderByMap: Record<string, any> = {
      date: { date: sortOrder },
      amount: { amount: sortOrder },
      description: { description: sortOrder },
      merchant: { merchant: sortOrder },
    }
    const orderBy = orderByMap[sortBy] || { date: 'desc' }

    // Fetch expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where })
    ])

    // Calculate aggregates for current filters
    const aggregates = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true },
      _min: { amount: true },
      _max: { amount: true },
    })

    // Get spending by category for current filters
    const categoryBreakdown = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    })

    // Fetch category details for breakdown
    const categoryIds = categoryBreakdown.map(c => c.categoryId).filter(Boolean) as string[]
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    })

    const enrichedCategoryBreakdown = categoryBreakdown.map(item => {
      const category = categories.find(c => c.id === item.categoryId)
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Uncategorized',
        categoryIcon: category?.icon,
        categoryColor: category?.color,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count,
        percentage: ((item._sum.amount || 0) / (aggregates._sum.amount || 1)) * 100
      }
    }).sort((a, b) => b.totalAmount - a.totalAmount)

    return NextResponse.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      aggregates: {
        totalAmount: aggregates._sum.amount || 0,
        averageAmount: aggregates._avg.amount || 0,
        minAmount: aggregates._min.amount || 0,
        maxAmount: aggregates._max.amount || 0,
        transactionCount: total,
      },
      categoryBreakdown: enrichedCategoryBreakdown,
      filters: {
        q,
        categoryId,
        paymentMethod,
        merchant,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
      }
    })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}

// Validation schema for expense creation
const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  date: z.string().datetime(),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NET_BANKING', 'OTHER']),
  merchant: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(), // For receipt storage
})

// POST: Create new expense with receipt support
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

    // Check user's subscription limits
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyExpenseCount = await prisma.expense.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: currentMonth
        }
      }
    })

    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    const plan = userSubscription?.plan || 'FREE'
    const limit = plan === 'FREE' ? 50 : -1

    if (limit !== -1 && monthlyExpenseCount >= limit) {
      return NextResponse.json(
        { error: "Monthly expense limit reached. Please upgrade to Premium." },
        { status: 403 }
      )
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        date: new Date(validatedData.date),
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

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error creating expense:", error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}

// PATCH: Update expense
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
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const expense = await prisma.expense.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    // Update expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
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

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

// DELETE: Delete expense
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
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership and delete
    const deletedExpense = await prisma.expense.deleteMany({
      where: { id, userId: session.user.id }
    })

    if (deletedExpense.count === 0) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}