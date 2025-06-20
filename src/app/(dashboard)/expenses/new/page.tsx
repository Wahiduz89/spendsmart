import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseForm } from '@/components/expenses/expense-form'

export const metadata: Metadata = {
  title: 'Add Expense | SpendSmart India',
  description: 'Add a new expense to track your spending',
}

export default async function NewExpensePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Expense</h1>
        <p className="text-gray-500">
          Record your spending to track where your money goes
        </p>
      </div>

      <ExpenseForm categories={categories} />
    </div>
  )
}