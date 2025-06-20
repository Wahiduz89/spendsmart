'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PAYMENT_METHODS, COMMON_MERCHANTS } from '@/lib/constants'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

const expenseSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NET_BANKING', 'OTHER']),
  merchant: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  categories: Array<{
    id: string
    name: string
    icon?: string | null
  }>
  expense?: {
    id: string
    amount: number
    description: string
    date: Date
    categoryId?: string | null
    paymentMethod: string
    merchant?: string | null
    notes?: string | null
  }
}

export function ExpenseForm({ categories, expense }: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMerchantSuggestions, setShowMerchantSuggestions] = useState(false)
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount.toString() || '',
      description: expense?.description || '',
      date: expense ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      categoryId: expense?.categoryId || '',
      paymentMethod: (expense?.paymentMethod || 'CASH') as any,
      merchant: expense?.merchant || '',
      notes: expense?.notes || '',
    },
  })

  const watchedMerchant = watch('merchant')

  const handleMerchantInput = (value: string) => {
    setValue('merchant', value)
    
    if (value.length > 0) {
      const filtered = COMMON_MERCHANTS.filter(merchant =>
        merchant.toLowerCase().includes(value.toLowerCase())
      )
      setMerchantSuggestions(filtered)
      setShowMerchantSuggestions(filtered.length > 0)
    } else {
      setShowMerchantSuggestions(false)
    }
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
      }

      const url = expense ? `/api/expenses` : '/api/expenses'
      const method = expense ? 'PATCH' : 'POST'
      const body = expense ? { id: expense.id, ...payload } : payload

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save expense')
      }

      toast.success(expense ? 'Expense updated successfully' : 'Expense added successfully')
      router.push('/expenses')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
      console.error('Error saving expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Amount (₹) *
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
                Date *
              </label>
              <Input
                type="date"
                {...register('date')}
                className="mt-1"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Description *
            </label>
            <Input
              type="text"
              placeholder="What did you spend on?"
              {...register('description')}
              className="mt-1"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <Select {...register('categoryId')} className="mt-1">
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Payment Method *
              </label>
              <Select {...register('paymentMethod')} className="mt-1">
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.icon} {method.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="relative">
            <label className="text-sm font-medium text-gray-700">
              Merchant
            </label>
            <Input
              type="text"
              placeholder="Where did you make this purchase?"
              value={watchedMerchant}
              onChange={(e) => handleMerchantInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowMerchantSuggestions(false), 200)}
              className="mt-1"
            />
            
            {showMerchantSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {merchantSuggestions.map((merchant) => (
                  <button
                    key={merchant}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                    onClick={() => {
                      setValue('merchant', merchant)
                      setShowMerchantSuggestions(false)
                    }}
                  >
                    {merchant}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              placeholder="Any additional details..."
              {...register('notes')}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}