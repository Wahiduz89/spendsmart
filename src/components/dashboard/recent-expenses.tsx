'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

interface RecentExpensesProps {
  expenses: Array<{
    id: string
    amount: number
    description: string
    date: Date
    merchant?: string | null
    category?: {
      name: string
      icon?: string | null
      color?: string | null
    } | null
  }>
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No expenses recorded yet. Start tracking your spending!
            </p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between space-x-4 rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ 
                      backgroundColor: expense.category?.color 
                        ? `${expense.category.color}20` 
                        : '#e5e7eb' 
                    }}
                  >
                    <span className="text-lg">
                      {expense.category?.icon || '📋'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {expense.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{expense.category?.name || 'Uncategorized'}</span>
                      {expense.merchant && (
                        <>
                          <span>•</span>
                          <span>{expense.merchant}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(expense.date)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        {expenses.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/expenses"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all expenses →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}