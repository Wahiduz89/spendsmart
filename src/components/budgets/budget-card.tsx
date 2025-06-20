'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { BUDGET_PERIODS } from '@/lib/constants'
import { EditIcon, TrashIcon, AlertTriangleIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface BudgetCardProps {
  budget: {
    id: string
    amount: number
    period: string
    startDate: Date
    endDate: Date
    isActive: boolean
    spent: number
    remaining: number
    percentageUsed: number
    isOverBudget: boolean
    daysLeft: number
    category?: {
      id: string
      name: string
      icon?: string | null
      color?: string | null
    } | null
  }
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const periodLabel = BUDGET_PERIODS.find(p => p.value === budget.period)?.label || budget.period

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/budgets?id=${budget.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete budget')
      }

      toast.success('Budget deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete budget')
      console.error('Error deleting budget:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const getProgressColor = () => {
    if (budget.percentageUsed >= 100) return 'bg-red-500'
    if (budget.percentageUsed >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusColor = () => {
    if (budget.percentageUsed >= 100) return 'text-red-600 bg-red-50'
    if (budget.percentageUsed >= 80) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <>
      <Card className={cn(
        "relative overflow-hidden transition-all",
        budget.isOverBudget && "border-red-200"
      )}>
        {budget.isOverBudget && (
          <div className="absolute top-0 right-0 p-2">
            <AlertTriangleIcon className="h-5 w-5 text-red-500" />
          </div>
        )}

        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {budget.category ? (
                <>
                  <span className="text-xl">{budget.category.icon || '💰'}</span>
                  <span className="text-lg">{budget.category.name}</span>
                </>
              ) : (
                <>
                  <span className="text-xl">💰</span>
                  <span className="text-lg">Overall Budget</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(budget.spent)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-lg font-medium">{formatCurrency(budget.amount)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{budget.percentageUsed.toFixed(0)}% used</span>
              <span>{formatCurrency(budget.remaining)} left</span>
            </div>
            <div className="progress-bar">
              <div
                className={cn("progress-fill", getProgressColor())}
                style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full", getStatusColor())}>
              {periodLabel}
            </span>
            <span className="text-xs text-gray-500">
              {budget.daysLeft} days left
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}