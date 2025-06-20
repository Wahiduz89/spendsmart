import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { RecentExpenses } from '@/components/dashboard/recent-expenses'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const metadata: Metadata = {
  title: 'Dashboard | SpendSmart India',
  description: 'View your expense overview and financial insights',
}

async function getDashboardData(userId: string) {
  const currentDate = new Date()
  const startOfCurrentMonth = startOfMonth(currentDate)
  const endOfCurrentMonth = endOfMonth(currentDate)
  const startOfLastMonth = startOfMonth(subMonths(currentDate, 1))
  const endOfLastMonth = endOfMonth(subMonths(currentDate, 1))

  // Fetch current month expenses
  const currentMonthExpenses = await prisma.expense.aggregate({
    where: {
      userId,
      date: {
        gte: startOfCurrentMonth,
        lte: endOfCurrentMonth,
      },
    },
    _sum: { amount: true },
    _count: true,
  })

  // Fetch last month expenses
  const lastMonthExpenses = await prisma.expense.aggregate({
    where: {
      userId,
      date: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    _sum: { amount: true },
  })

  // Fetch active budgets with spending
  const activeBudgets = await prisma.budget.findMany({
    where: {
      userId,
      isActive: true,
      endDate: { gte: currentDate },
    },
    include: {
      category: true,
    },
  })

  // Calculate budget utilization
  const budgetsWithSpending = await Promise.all(
    activeBudgets.map(async (budget) => {
      const spending = await prisma.expense.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        _sum: { amount: true },
      })

      const spent = spending._sum.amount || 0
      const percentage = (spent / budget.amount) * 100

      return {
        ...budget,
        spent,
        percentage,
      }
    })
  )

  // Fetch recent expenses
  const recentExpenses = await prisma.expense.findMany({
    where: { userId },
    include: {
      category: {
        select: {
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 10,
  })

  // Fetch spending by category for current month
  const categorySpending = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      date: {
        gte: startOfCurrentMonth,
        lte: endOfCurrentMonth,
      },
    },
    _sum: { amount: true },
  })

  // Get category details
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categorySpending.map(c => c.categoryId).filter(Boolean) as string[] },
    },
  })

  const spendingByCategory = categorySpending.map(spending => {
    const category = categories.find(c => c.id === spending.categoryId)
    return {
      category: category?.name || 'Uncategorized',
      amount: spending._sum.amount || 0,
      color: category?.color || '#gray',
    }
  })

  return {
    currentMonthTotal: currentMonthExpenses._sum.amount || 0,
    lastMonthTotal: lastMonthExpenses._sum.amount || 0,
    transactionCount: currentMonthExpenses._count,
    budgetsWithSpending,
    recentExpenses,
    spendingByCategory,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const data = await getDashboardData(session.user.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {session.user.name}! Here's your financial overview.
        </p>
      </div>

      <OverviewCards data={data} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-4">
          <SpendingChart data={data.spendingByCategory} />
        </div>
        <div className="md:col-span-3">
          <RecentExpenses expenses={data.recentExpenses} />
        </div>
      </div>
    </div>
  )
}