import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const preferencesSchema = z.object({
  budgetAlerts: z.boolean().optional(),
  budgetThreshold: z.number().min(1).max(100).optional(),
  dailyDigest: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  expenseReminders: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
  pushAlerts: z.boolean().optional(),
})

// GET: Fetch user notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          budgetAlerts: true,
          budgetThreshold: 80,
          dailyDigest: false,
          weeklyReport: true,
          expenseReminders: true,
          emailAlerts: true,
          pushAlerts: false,
        },
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error fetching notification preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

// PATCH: Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = preferencesSchema.parse(body)

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error updating notification preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}