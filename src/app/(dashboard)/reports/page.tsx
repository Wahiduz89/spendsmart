import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SpendingTrends } from '@/components/reports/spending-trends'
import { CategoryBreakdown } from '@/components/reports/category-breakdown'
import { MonthlyComparison } from '@/components/reports/monthly-comparison'
import { formatCurrency, getFinancialYear } from '@/lib/utils'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export const metadata: Metadata = {
  title: 'Reports | SpendSmart India',
  description: 'Analyze your spending patterns and financial insights',
}

interface ReportsPageProps {
  searchParams: {
    period?: string
    startDate?: string
    endDate?: string
  }
}

async function getReportsData(userId: string, searchParams: ReportsPageProps['searchParams']) {
  const currentDate = new Date()
  const period = searchParams.period || 'month'
  
  let startDate: Date
  let endDate: Date

  if (searchParams.startDate && searchParams.endDate) {
    startDate = new Date(searchParams.startDate)
    endDate = new Date(searchParams.endDate)
  } else {
    switch (period) {
      case 'week':
        startDate = new Date(currentDate.setDate(currentDate.getDate() - 7))
        endDate = new Date()
        break
      case 'month':
        startDate = startOfMonth(currentDate)
        endDate = endOfMonth(currentDate)
        break
      case 'quarter':
        startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 3))
        endDate = new Date()
        break
      case 'year':
        startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1))
        endDate = new Date()
        break
      case 'fy':
        const fy = getFinancialYear()
        startDate = fy.start
        endDate = fy.end
        break
      default:
        startDate = startOfMonth(currentDate)
        endDate = endOfMonth(currentDate)
    }
  }

  // Get total spending for the period
  const totalSpending = await prisma.expense.aggregate({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  })

  // Get spending by category
  const categorySpending = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
  })

  // Get category details
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categorySpending.map(c => c.categoryId).filter(Boolean) as string[] },
    },
  })

  const categoryData = categorySpending.map(spending => {
    const category = categories.find(c => c.id === spending.categoryId)
    return {
      category: category?.name || 'Uncategorized',
      icon: category?.icon || '📋',
      color: category?.color || '#gray',
      amount: spending._sum.amount || 0,
      count: spending._count,
      percentage: ((spending._sum.amount || 0) / (totalSpending._sum.amount || 1)) * 100,
    }
  })

  // Get spending by payment method
  const paymentMethodSpending = await prisma.expense.groupBy({
    by: ['paymentMethod'],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  })

  // Get monthly trends (last 6 months)
  const monthlyTrends = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(subMonths(new Date(), i))
      
      return prisma.expense.aggregate({
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }).then(result => ({
        month: monthStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        amount: result._sum.amount || 0,
      }))
    })
  ).then(results => results.reverse())

  // Get top merchants
  const topMerchants = await prisma.expense.groupBy({
    by: ['merchant'],
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      merchant: {
        not: null,
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
    take: 10,
  })

  // Get daily average
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dailyAverage = (totalSpending._sum.amount || 0) / daysDiff

  return {
    totalSpending: totalSpending._sum.amount || 0,
    transactionCount: totalSpending._count,
    dailyAverage,
    categoryData,
    paymentMethodSpending,
    monthlyTrends,
    topMerchants,
    startDate,
    endDate,
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const data = await getReportsData(session.user.id, searchParams)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-gray-500">
          Gain insights into your spending patterns and financial behavior
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spending
            </CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalSpending)}
            </div>
            <p className="text-xs text-gray-500">
              {data.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Daily Average
            </CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.dailyAverage)}
            </div>
            <p className="text-xs text-gray-500">
              Per day spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Category
            </CardTitle>
            <span className="text-2xl">
              {data.categoryData[0]?.icon || '📊'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.categoryData[0]?.category || 'N/A'}
            </div>
            <p className="text-xs text-gray-500">
              {formatCurrency(data.categoryData[0]?.amount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Most Used Method
            </CardTitle>
            <span className="text-2xl">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.paymentMethodSpending[0]?._id || 'N/A'}
            </div>
            <p className="text-xs text-gray-500">
              {data.paymentMethodSpending[0]?._count || 0} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Visualizations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingTrends data={data.monthlyTrends} />
        <CategoryBreakdown data={data.categoryData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlyComparison 
          currentMonth={data.monthlyTrends[data.monthlyTrends.length - 1]?.amount || 0}
          previousMonth={data.monthlyTrends[data.monthlyTrends.length - 2]?.amount || 0}
        />
        
        {/* Top Merchants */}
        <Card>
          <CardHeader>
            <CardTitle>Top Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topMerchants.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No merchant data available
                </p>
              ) : (
                data.topMerchants.map((merchant, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {index + 1}. {merchant.merchant}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({merchant._count} visits)
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(merchant._sum.amount || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}