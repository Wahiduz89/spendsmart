import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateCategoryColor } from "@/lib/utils"

// Validation schema for category creation
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  icon: z.string().optional(),
  color: z.string().optional(),
})

// GET: Fetch user categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { expenses: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    // Add spending statistics for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const currentMonth = new Date()
        currentMonth.setDate(1)
        currentMonth.setHours(0, 0, 0, 0)

        const monthlySpending = await prisma.expense.aggregate({
          where: {
            userId: session.user.id,
            categoryId: category.id,
            date: {
              gte: currentMonth
            }
          },
          _sum: {
            amount: true
          }
        })

        return {
          ...category,
          monthlySpending: monthlySpending._sum.amount || 0
        }
      })
    )

    return NextResponse.json(categoriesWithStats)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

// POST: Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Check subscription limits for custom categories
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    const customCategoriesCount = await prisma.category.count({
      where: {
        userId: session.user.id,
        isDefault: false
      }
    })

    const plan = userSubscription?.plan || 'FREE'
    const limit = plan === 'FREE' ? 5 : -1

    if (limit !== -1 && customCategoriesCount >= limit) {
      return NextResponse.json(
        { error: "Custom category limit reached. Please upgrade to Premium." },
        { status: 403 }
      )
    }

    // Check for duplicate category name
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: validatedData.name
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        color: validatedData.color || generateCategoryColor(),
        userId: session.user.id,
        isDefault: false
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}

// PATCH: Update category
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
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Prevent modification of default categories
    if (category.isDefault) {
      return NextResponse.json(
        { error: "Cannot modify default categories" },
        { status: 403 }
      )
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}

// DELETE: Delete category
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
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership and check if default
    const category = await prisma.category.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default categories" },
        { status: 403 }
      )
    }

    // Check if category has expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id }
    })

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing expenses" },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}