import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseList } from '@/components/expenses/expense-list'
import { AdvancedSearch } from '@/components/expenses/advanced-search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PlusIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Expenses | SpendSmart India',
  description: 'Manage and track your expenses',
}

interface ExpensesPageProps {
  searchParams: {
    page?: string
    q?: string
    category?: string
    startDate?: string
    endDate?: string
    paymentMethod?: string
    merchant?: string
    minAmount?: string
    maxAmount?: string
    sortBy?: string
    sortOrder?: string
  }
}

async function getExpenses(userId: string, searchParams: ExpensesPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = { userId }

  // Global search
  if (searchParams.q) {
    where.OR = [
      { description: { contains: searchParams.q, mode: 'insensitive' } },
      { merchant: { contains: searchParams.q, mode: 'insensitive' } },
      { notes: { contains: searchParams.q, mode: 'insensitive' } },
    ]
  }

  // Category filter
  if (searchParams.category) {
    where.categoryId = searchParams.category
  }

  // Payment method filter
  if (searchParams.paymentMethod) {
    where.paymentMethod = searchParams.paymentMethod
  }

  // Merchant filter
  if (searchParams.merchant) {
    where.merchant = { contains: searchParams.merchant, mode: 'insensitive' }
  }

  // Date range filter
  if (searchParams.startDate || searchParams.endDate) {
    where.date = {}
    if (searchParams.startDate) {
      where.date.gte = new Date(searchParams.startDate)
    }
    if (searchParams.endDate) {
      where.date.lte = new Date(searchParams.endDate)
    }
  }

  // Amount range filter
  if (searchParams.minAmount || searchParams.maxAmount) {
    where.amount = {}
    if (searchParams.minAmount) {
      where.amount.gte = parseFloat(searchParams.minAmount)
    }
    if (searchParams.maxAmount) {
      where.amount.lte = parseFloat(searchParams.maxAmount)
    }
  }

  // Build orderBy
  const sortBy = searchParams.sortBy || 'date'
  const sortOrder = searchParams.sortOrder || 'desc'
  const orderByMap: Record<string, any> = {
    date: { date: sortOrder },
    amount: { amount: sortOrder },
    description: { description: sortOrder },
    merchant: { merchant: sortOrder },
  }
  const orderBy = orderByMap[sortBy] || { date: 'desc' }

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
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ])

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  // Calculate aggregates
  const aggregates = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
    _avg: { amount: true },
    _count: true,
  })

  // Get current month comparison
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const lastMonth = new Date(currentMonth)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const [currentMonthTotal, lastMonthTotal] = await Promise.all([
    prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: currentMonth,
        },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: lastMonth,
          lt: currentMonth,
        },
      },
      _sum: { amount: true },
    }),
  ])

  return {
    expenses,
    categories,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
    aggregates: {
      totalAmount: aggregates._sum.amount || 0,
      averageAmount: aggregates._avg.amount || 0,
      transactionCount: aggregates._count,
    },
    monthComparison: {
      current: currentMonthTotal._sum.amount || 0,
      previous: lastMonthTotal._sum.amount || 0,
    },
  }
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const { expenses, categories, pagination, aggregates, monthComparison } = await getExpenses(
    session.user.id,
    searchParams
  )

  const monthlyChange = monthComparison.current - monthComparison.previous
  const monthlyChangePercent = monthComparison.previous > 0 
    ? ((monthlyChange / monthComparison.previous) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-gray-500">
            Track and manage all your expenses in one place
          </p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {aggregates.transactionCount > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Filtered Total
              </CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(aggregates.totalAmount)}
              </div>
              <p className="text-xs text-gray-500">
                {aggregates.transactionCount} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Expense
              </CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(aggregates.averageAmount)}
              </div>
              <p className="text-xs text-gray-500">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Month
              </CardTitle>
              <span className="text-2xl">📅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(monthComparison.current)}
              </div>
              <p className="text-xs text-gray-500">
                Current month total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Change
              </CardTitle>
              {monthlyChange >= 0 ? (
                <TrendingUpIcon className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDownIcon className="h-5 w-5 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monthlyChange >= 0 ? '+' : ''}{monthlyChangePercent}%
              </div>
              <p className="text-xs text-gray-500">
                vs last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Search */}
      <AdvancedSearch categories={categories} />

      {/* Expense List */}
      <ExpenseList
        expenses={expenses}
        categories={categories}
        pagination={pagination}
        searchParams={searchParams}
      />
    </div>
  )
}