import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseList } from '@/components/expenses/expense-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Expenses | SpendSmart India',
  description: 'Manage and track your expenses',
}

interface ExpensesPageProps {
  searchParams: {
    page?: string
    category?: string
    startDate?: string
    endDate?: string
    paymentMethod?: string
  }
}

async function getExpenses(userId: string, searchParams: ExpensesPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = { userId }

  if (searchParams.category) {
    where.categoryId = searchParams.category
  }

  if (searchParams.paymentMethod) {
    where.paymentMethod = searchParams.paymentMethod
  }

  if (searchParams.startDate || searchParams.endDate) {
    where.date = {}
    if (searchParams.startDate) {
      where.date.gte = new Date(searchParams.startDate)
    }
    if (searchParams.endDate) {
      where.date.lte = new Date(searchParams.endDate)
    }
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ])

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })

  return {
    expenses,
    categories,
    pagination: {
      page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  }
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const { expenses, categories, pagination } = await getExpenses(
    session.user.id,
    searchParams
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-gray-500">
            Track and manage all your expenses in one place
          </p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <ExpenseList
        expenses={expenses}
        categories={categories}
        pagination={pagination}
        searchParams={searchParams}
      />
    </div>
  )
}