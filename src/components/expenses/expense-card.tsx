'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { PAYMENT_METHODS } from '@/lib/constants'
import { EditIcon, TrashIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ExpenseCardProps {
  expense: {
    id: string
    amount: number
    description: string
    date: Date
    merchant?: string | null
    paymentMethod: string
    notes?: string | null
    category?: {
      id: string
      name: string
      icon?: string | null
      color?: string | null
    } | null
  }
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const paymentMethod = PAYMENT_METHODS.find(
    (method) => method.value === expense.paymentMethod
  )

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/expenses?id=${expense.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      toast.success('Expense deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete expense')
      console.error('Error deleting expense:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: expense.category?.color
                    ? `${expense.category.color}20`
                    : '#e5e7eb',
                }}
              >
                <span className="text-xl">
                  {expense.category?.icon || '📋'}
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium">{expense.description}</h3>
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {expense.category?.name || 'Uncategorized'}
                  </span>
                  {expense.merchant && (
                    <>
                      <span>•</span>
                      <span>{expense.merchant}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{paymentMethod?.label || expense.paymentMethod}</span>
                  <span>•</span>
                  <span>{formatDateTime(expense.date)}</span>
                </div>
                
                {expense.notes && (
                  <p className="text-sm text-gray-600 mt-2">{expense.notes}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="text-right mr-4">
                <p className="text-lg font-semibold">
                  {formatCurrency(expense.amount)}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/expenses/${expense.id}/edit`)}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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