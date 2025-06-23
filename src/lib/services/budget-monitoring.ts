import { prisma } from '@/lib/prisma'

interface BudgetAlert {
  budgetId: string
  userId: string
  categoryName: string
  spent: number
  budget: number
  percentage: number
  type: 'WARNING' | 'EXCEEDED'
}

export class BudgetMonitoringService {
  // Check all active budgets and generate notifications
  static async checkBudgetsAndNotify() {
    try {
      const activeBudgets = await prisma.budget.findMany({
        where: {
          isActive: true,
          endDate: { gte: new Date() },
        },
        include: {
          category: true,
          user: {
            include: {
              notificationPreference: true,
            },
          },
        },
      })

      const alerts: BudgetAlert[] = []

      // Check each budget
      for (const budget of activeBudgets) {
        const spent = await this.calculateBudgetSpending(budget)
        const percentage = (spent / budget.amount) * 100

        // Check if user has notification preferences
        const preferences = budget.user.notificationPreference
        if (!preferences?.budgetAlerts) continue

        const threshold = preferences.budgetThreshold || 80

        // Check if we need to send an alert
        if (percentage >= 100 && !await this.hasRecentNotification(budget.id, 'BUDGET_EXCEEDED')) {
          alerts.push({
            budgetId: budget.id,
            userId: budget.userId,
            categoryName: budget.category?.name || 'Overall',
            spent,
            budget: budget.amount,
            percentage,
            type: 'EXCEEDED',
          })
        } else if (percentage >= threshold && percentage < 100 && !await this.hasRecentNotification(budget.id, 'BUDGET_WARNING')) {
          alerts.push({
            budgetId: budget.id,
            userId: budget.userId,
            categoryName: budget.category?.name || 'Overall',
            spent,
            budget: budget.amount,
            percentage,
            type: 'WARNING',
          })
        }
      }

      // Create notifications for alerts
      for (const alert of alerts) {
        await this.createBudgetNotification(alert)
      }

      return alerts
    } catch (error) {
      console.error('Error in budget monitoring:', error)
      throw error
    }
  }

  // Calculate current spending for a budget
  private static async calculateBudgetSpending(budget: any): Promise<number> {
    const where: any = {
      userId: budget.userId,
      date: {
        gte: budget.startDate,
        lte: budget.endDate,
      },
    }

    if (budget.categoryId) {
      where.categoryId = budget.categoryId
    }

    const result = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    })

    return result._sum.amount || 0
  }

  // Check if a similar notification was sent recently (within 24 hours)
  private static async hasRecentNotification(budgetId: string, type: string): Promise<boolean> {
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const recent = await prisma.notification.findFirst({
      where: {
        relatedId: budgetId,
        type: type === 'BUDGET_EXCEEDED' ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING',
        createdAt: { gte: oneDayAgo },
      },
    })

    return !!recent
  }

  // Create budget notification
  private static async createBudgetNotification(alert: BudgetAlert) {
    const isExceeded = alert.type === 'EXCEEDED'
    
    const notification = await prisma.notification.create({
      data: {
        userId: alert.userId,
        type: isExceeded ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING',
        priority: isExceeded ? 'HIGH' : 'MEDIUM',
        title: isExceeded 
          ? `Budget Exceeded: ${alert.categoryName}`
          : `Budget Alert: ${alert.categoryName}`,
        message: isExceeded
          ? `You've exceeded your ${alert.categoryName} budget! Spent ₹${alert.spent.toFixed(0)} of ₹${alert.budget.toFixed(0)} (${alert.percentage.toFixed(0)}%)`
          : `You've used ${alert.percentage.toFixed(0)}% of your ${alert.categoryName} budget. ₹${(alert.budget - alert.spent).toFixed(0)} remaining.`,
        relatedId: alert.budgetId,
        relatedType: 'budget',
        metadata: {
          categoryName: alert.categoryName,
          spent: alert.spent,
          budget: alert.budget,
          percentage: alert.percentage,
        },
      },
    })

    return notification
  }

  // Generate weekly spending summary
  static async generateWeeklySummary(userId: string) {
    try {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      // Get weekly spending
      const weeklySpending = await prisma.expense.aggregate({
        where: {
          userId,
          date: { gte: oneWeekAgo },
        },
        _sum: { amount: true },
        _count: true,
      })

      // Get top categories
      const categorySpending = await prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          date: { gte: oneWeekAgo },
        },
        _sum: { amount: true },
        orderBy: {
          _sum: { amount: 'desc' },
        },
        take: 3,
      })

      // Get category details
      const categoryIds = categorySpending.map(c => c.categoryId).filter(Boolean) as string[]
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      })

      const topCategories = categorySpending.map(cs => {
        const category = categories.find(c => c.id === cs.categoryId)
        return {
          name: category?.name || 'Uncategorized',
          amount: cs._sum.amount || 0,
        }
      })

      // Create weekly summary notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'WEEKLY_SUMMARY',
          priority: 'LOW',
          title: 'Your Weekly Spending Summary',
          message: `You spent ₹${(weeklySpending._sum.amount || 0).toFixed(0)} across ${weeklySpending._count} transactions this week. Top categories: ${topCategories.map(c => `${c.name} (₹${c.amount.toFixed(0)})`).join(', ')}`,
          metadata: {
            totalSpent: weeklySpending._sum.amount || 0,
            transactionCount: weeklySpending._count,
            topCategories,
          },
        },
      })
    } catch (error) {
      console.error('Error generating weekly summary:', error)
    }
  }

  // Check for expense tracking reminders
  static async checkExpenseReminders() {
    try {
      const users = await prisma.user.findMany({
        include: {
          notificationPreference: true,
          expenses: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      })

      for (const user of users) {
        if (!user.notificationPreference?.expenseReminders) continue

        const lastExpense = user.expenses[0]
        if (!lastExpense) continue

        const daysSinceLastExpense = Math.floor(
          (Date.now() - new Date(lastExpense.date).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Send reminder if no expense tracked in 3 days
        if (daysSinceLastExpense >= 3) {
          const hasRecentReminder = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'EXPENSE_REMINDER',
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
              },
            },
          })

          if (!hasRecentReminder) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                type: 'EXPENSE_REMINDER',
                priority: 'LOW',
                title: 'Track Your Expenses',
                message: `You haven't tracked any expenses in ${daysSinceLastExpense} days. Stay on top of your spending by adding your recent transactions.`,
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking expense reminders:', error)
    }
  }
}

// Cron job handler (to be called from API route or external cron service)
export async function runScheduledJobs() {
  try {
    // Run budget monitoring
    await BudgetMonitoringService.checkBudgetsAndNotify()
    
    // Check expense reminders
    await BudgetMonitoringService.checkExpenseReminders()
    
    // Generate weekly summaries on Sundays
    const today = new Date()
    if (today.getDay() === 0) { // Sunday
      const users = await prisma.user.findMany({
        include: {
          notificationPreference: true,
        },
      })
      
      for (const user of users) {
        if (user.notificationPreference?.weeklyReport) {
          await BudgetMonitoringService.generateWeeklySummary(user.id)
        }
      }
    }
    
    return { success: true, timestamp: new Date() }
  } catch (error) {
    console.error('Error running scheduled jobs:', error)
    throw error
  }
}