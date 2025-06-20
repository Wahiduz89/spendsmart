import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BudgetForm } from '@/components/budgets/budget-form'
import { BudgetCard } from '@/components/budgets/budget-card'
import { PlusIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Budgets | SpendSmart India',
  description: 'Manage your spending budgets and financial goals',
}

async function getBudgetsWithSpending(userId: string) {
  const currentDate = new Date()
  
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const spendingWhere: any = {
        userId,
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      }

      if (budget.categoryId) {
        spendingWhere.categoryId = budget.categoryId
      }

      const spending = await prisma.expense.aggregate({
        where: spendingWhere,
        _sum: {
          amount: true,
        },
      })

      const spent = spending._sum.amount || 0
      const remaining = budget.amount - spent
      const percentageUsed = (spent / budget.amount) * 100
      const isOverBudget = spent > budget.amount
      const daysLeft = Math.max(
        0,
        Math.ceil((budget.endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      )

      return {
        ...budget,
        spent,
        remaining,
        percentageUsed,
        isOverBudget,
        daysLeft,
      }
    })
  )

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  return { budgets: budgetsWithSpending, categories }
}

export default async function BudgetsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const { budgets, categories } = await getBudgetsWithSpending(session.user.id)

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const overBudgetCount = budgets.filter(budget => budget.isOverBudget).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-gray-500">
            Set spending limits and track your progress
          </p>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Budgeted
            </CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudgeted)}
            </div>
            <p className="text-xs text-gray-500">
              Across {budgets.length} active budgets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spent
            </CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-gray-500">
              {((totalSpent / totalBudgeted) * 100).toFixed(0)}% of total budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Over Budget
            </CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overBudgetCount}
            </div>
            <p className="text-xs text-gray-500">
              Categories exceeding limits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Budgets</h2>
          <BudgetForm categories={categories} />
        </div>

        {budgets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">
                No active budgets. Create one to start tracking your spending limits.
              </p>
              <BudgetForm categories={categories} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}