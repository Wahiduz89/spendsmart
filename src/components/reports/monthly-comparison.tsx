'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, calculatePercentageChange } from "@/lib/utils"
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'

interface MonthlyComparisonProps {
  currentMonth: number
  previousMonth: number
}

export function MonthlyComparison({ currentMonth, previousMonth }: MonthlyComparisonProps) {
  const difference = currentMonth - previousMonth
  const percentageChange = calculatePercentageChange(currentMonth, previousMonth)
  const isIncrease = difference > 0

  const insights = []
  
  if (Math.abs(percentageChange) > 20) {
    insights.push({
      type: isIncrease ? 'warning' : 'success',
      message: `${isIncrease ? 'Significant increase' : 'Great reduction'} in spending (${Math.abs(percentageChange).toFixed(0)}%)`,
    })
  }
  
  if (currentMonth > 50000) {
    insights.push({
      type: 'info',
      message: 'High spending month - consider reviewing your budget',
    })
  }
  
  if (previousMonth > 0 && currentMonth < previousMonth * 0.7) {
    insights.push({
      type: 'success',
      message: 'Excellent job reducing expenses!',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month-over-Month Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Previous Month</p>
            <p className="text-2xl font-bold">{formatCurrency(previousMonth)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Current Month</p>
            <p className="text-2xl font-bold">{formatCurrency(currentMonth)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Difference</span>
            <div className="flex items-center space-x-2">
              {isIncrease ? (
                <ArrowUpIcon className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-green-500" />
              )}
              <span className={`font-semibold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium">Change</span>
            <div className="flex items-center space-x-2">
              {isIncrease ? (
                <TrendingUpIcon className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-green-500" />
              )}
              <span className={`font-semibold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                {isIncrease ? '+' : ''}{percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Insights</p>
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`text-sm p-3 rounded-lg ${
                  insight.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                {insight.message}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}