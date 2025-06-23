import { NextRequest, NextResponse } from "next/server"
import { runScheduledJobs } from "@/lib/services/budget-monitoring"

// This endpoint should be called by a cron service like:
// - Vercel Cron Jobs
// - GitHub Actions
// - External cron services (cron-job.org, EasyCron)
// - Upstash Cron

// Add authentication for cron job endpoint
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Run scheduled jobs
    const result = await runScheduledJobs()
    
    return NextResponse.json({
      success: true,
      message: "Scheduled jobs completed",
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error running cron jobs:", error)
    return NextResponse.json(
      { 
        error: "Failed to run scheduled jobs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// For Vercel Cron Jobs, you can also use this config:
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Maximum execution time in seconds