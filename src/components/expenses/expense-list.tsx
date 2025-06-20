'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ExpenseCard } from './expense-card'
import { formatCurrency } from '@/lib/utils'
import { PAYMENT_METHODS } from '@/lib/constants'
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon } from 'lucide-react'

interface ExpenseListProps {
  expenses: Array<{
    id: string
    amount: number
    description: string
    date: Date
    merchant?: string | null
    paymentMethod: string
    category?: {
      id: string
      name: string
      icon?: string | null
      color?: string | null
    } | null
  }>
  categories: Array<{
    id: string
    name: string
  }>
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  searchParams: {
    page?: string
    category?: string
    startDate?: string
    endDate?: string
    paymentMethod?: string
  }
}

export function ExpenseList({ 
  expenses, 
  categories, 
  pagination, 
  searchParams 
}: ExpenseListProps) {
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as any)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') // Reset to first page on filter change
    router.push(`/expenses?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams as any)
    params.set('page', page.toString())
    router.push(`/expenses?${params.toString()}`)
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <div className="text-sm text-gray-500">
              Showing {expenses.length} of {pagination.total} expenses
            </div>
          </div>

          {showFilters && (
            <div className="grid gap-4 md:grid-cols-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <Select
                  value={searchParams.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="mt-1"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <Select
                  value={searchParams.paymentMethod || ''}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="mt-1"
                >
                  <option value="">All Methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={searchParams.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <Input
                  type="date"
                  value={searchParams.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="bg-primary-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary-900">
            Total for current view:
          </span>
          <span className="text-lg font-bold text-primary-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-4">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                No expenses found matching your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}