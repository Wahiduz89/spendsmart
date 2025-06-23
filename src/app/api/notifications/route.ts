import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureUserSetup } from "@/lib/middleware/user-setup"

// GET: Fetch user notifications with enhanced error handling
export async function GET(request: NextRequest) {
  try {
    // Verify user setup first
    const setupResponse = await ensureUserSetup(request)
    if (setupResponse) return setupResponse

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        }, 
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const type = searchParams.get("type")

    const where: any = { userId: session.user.id }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type

    // Fetch notifications with error handling
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }).catch(error => {
        console.error('Error fetching notifications:', error)
        return []
      }),
      
      prisma.notification.count({ where }).catch(error => {
        console.error('Error counting notifications:', error)
        return 0
      }),
      
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }).catch(error => {
        console.error('Error counting unread notifications:', error)
        return 0
      }),
    ])

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
      unreadCount: unreadCount || 0,
    })
  } catch (error) {
    console.error("Error in notifications GET handler:", error)
    
    // Provide specific error messages for different types of errors
    let errorMessage = "Failed to fetch notifications"
    let errorCode = "UNKNOWN_ERROR"
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        errorMessage = "Database connection error"
        errorCode = "DB_CONNECTION_ERROR"
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timeout"
        errorCode = "TIMEOUT_ERROR"
      } else if (error.message.includes('permission')) {
        errorMessage = "Permission denied"
        errorCode = "PERMISSION_ERROR"
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST: Create notification with validation
export async function POST(request: NextRequest) {
  try {
    const setupResponse = await ensureUserSetup(request)
    if (setupResponse) return setupResponse

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    
    // Validate required fields
    if (!body.title || !body.message || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: title, message, type" },
        { status: 400 }
      )
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: body.title,
        message: body.message,
        type: body.type,
        priority: body.priority || 'MEDIUM',
        relatedId: body.relatedId,
        relatedType: body.relatedType,
        metadata: body.metadata,
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}

// PATCH: Mark notifications as read with validation
export async function PATCH(request: NextRequest) {
  try {
    const setupResponse = await ensureUserSetup(request)
    if (setupResponse) return setupResponse

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      const updateResult = await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
      
      return NextResponse.json({ 
        message: "All notifications marked as read",
        updatedCount: updateResult.count
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Validate that all notification IDs belong to the user
      const validNotifications = await prisma.notification.findMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        select: { id: true }
      })
      
      const validIds = validNotifications.map(n => n.id)
      
      if (validIds.length === 0) {
        return NextResponse.json(
          { error: "No valid notifications found" },
          { status: 404 }
        )
      }
      
      const updateResult = await prisma.notification.updateMany({
        where: {
          id: { in: validIds },
          userId: session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
      
      return NextResponse.json({ 
        message: "Notifications marked as read",
        updatedCount: updateResult.count
      })
    } else {
      return NextResponse.json(
        { error: "Invalid request: provide notificationIds array or markAllRead flag" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}

// DELETE: Delete notifications with validation
export async function DELETE(request: NextRequest) {
  try {
    const setupResponse = await ensureUserSetup(request)
    if (setupResponse) return setupResponse

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (deleteAll) {
      const deleteResult = await prisma.notification.deleteMany({
        where: { userId: session.user.id },
      })
      
      return NextResponse.json({ 
        message: "All notifications deleted",
        deletedCount: deleteResult.count
      })
    } else if (id) {
      // Verify ownership before deletion
      const notification = await prisma.notification.findFirst({
        where: { id, userId: session.user.id }
      })
      
      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found" },
          { status: 404 }
        )
      }
      
      await prisma.notification.delete({
        where: { id }
      })
      
      return NextResponse.json({ message: "Notification deleted" })
    } else {
      return NextResponse.json(
        { error: "Invalid request: provide notification id or deleteAll parameter" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    )
  }
}