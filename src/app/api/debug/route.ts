import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Not authenticated",
        session: session 
      }, { status: 401 })
    }

    // Check user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      session: {
        user: session.user
      },
      database: {
        user: user,
        categoriesCount: user?.categories.length || 0,
        expensesCount: user?._count.expenses || 0,
        budgetsCount: user?._count.budgets || 0,
        subscription: user?.subscription
      }
    })
  } catch (error) {
    console.error("Debug API Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}