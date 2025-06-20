'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, calculatePercentageChange } from "@/lib/utils"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

interface OverviewCardsProps {
  data: {
    currentMonthTotal: number
    lastMonthTotal: number
    transactionCount: number
    budgetsWithSpending: any[]
  }
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const percentageChange = calculatePercentageChange(
    data.currentMonthTotal,
    data.lastMonthTotal
  )
  
  const totalBudget = data.budgetsWithSpending.reduce(
    (sum, budget) => sum + budget.amount,
    0
  )
  
  const totalSpentOnBudgets = data.budgetsWithSpending.reduce(
    (sum, budget) => sum + budget.spent,
    0
  )
  
  const budgetUtilization = totalBudget > 0 
    ? (totalSpentOnBudgets / totalBudget) * 100 
    : 0

  const overBudgetCount = data.budgetsWithSpending.filter(
    budget => budget.percentage > 100
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Spent This Month
          </CardTitle>
          <span className="text-2xl">💸</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.currentMonthTotal)}
          </div>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            {percentageChange > 0 ? (
              <>
                <ArrowUpIcon className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-500">
                  {percentageChange.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <ArrowDownIcon className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">
                  {Math.abs(percentageChange).toFixed(1)}%
                </span>
              </>
            )}
            <span className="ml-1">from last month</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Transactions
          </CardTitle>
          <span className="text-2xl">📊</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.transactionCount}</div>
          <p className="text-xs text-gray-500">
            This month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Budget Utilization
          </CardTitle>
          <span className="text-2xl">🎯</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {budgetUtilization.toFixed(0)}%
          </div>
          <p className="text-xs text-gray-500">
            {formatCurrency(totalSpentOnBudgets)} of {formatCurrency(totalBudget)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Budget Alerts
          </CardTitle>
          <span className="text-2xl">⚠️</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overBudgetCount}</div>
          <p className="text-xs text-gray-500">
            Categories over budget
          </p>
        </CardContent>
      </Card>
    </div>
  )
}