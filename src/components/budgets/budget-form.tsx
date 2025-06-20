'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { BUDGET_PERIODS } from '@/lib/constants'
import { toast } from 'react-hot-toast'
import { PlusIcon } from 'lucide-react'

const budgetSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  categoryId: z.string().optional(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface BudgetFormProps {
  categories: Array<{
    id: string
    name: string
    icon?: string | null
  }>
}

export function BudgetForm({ categories }: BudgetFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: '',
      categoryId: '',
      period: 'MONTHLY',
    },
  })

  const onSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true)
    
    try {
      const payload = {
        amount: parseFloat(data.amount),
        categoryId: data.categoryId || null,
        period: data.period,
      }

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create budget')
      }

      toast.success('Budget created successfully')
      reset()
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
      console.error('Error creating budget:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 h-4 w-4" />
        Create Budget
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Budget Amount (₹) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
                className="mt-1"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <Select {...register('categoryId')} className="mt-1">
                <option value="">All Categories (Overall Budget)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to set an overall spending budget
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Budget Period *
              </label>
              <Select {...register('period')} className="mt-1">
                {BUDGET_PERIODS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset()
                  setOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}