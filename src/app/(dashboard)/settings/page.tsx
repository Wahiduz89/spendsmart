import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { CheckIcon, DownloadIcon, CreditCardIcon, UserIcon, ShieldIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings | SpendSmart India',
  description: 'Manage your account settings and preferences',
}

async function getUserData(userId: string) {
  const [user, subscription, expenseCount, categoryCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.subscription.findUnique({
      where: { userId },
    }),
    prisma.expense.count({
      where: { userId },
    }),
    prisma.category.count({
      where: { userId, isDefault: false },
    }),
  ])

  return { user, subscription, expenseCount, categoryCount }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const { user, subscription, expenseCount, categoryCount } = await getUserData(
    session.user.id
  )

  const currentPlan = subscription?.plan || 'FREE'
  const planDetails = PLANS[currentPlan as keyof typeof PLANS]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserIcon className="mr-2 h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1">{user?.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="mt-1">{formatDate(user?.createdAt || new Date())}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="mt-1">{expenseCount} transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCardIcon className="mr-2 h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            Your current plan and usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{planDetails.name} Plan</h3>
              <p className="text-sm text-gray-500">
                {planDetails.price === 0 ? 'Free forever' : `₹${planDetails.price}/month`}
              </p>
            </div>
            {currentPlan !== 'PREMIUM' && (
              <Link href="/pricing">
                <Button>Upgrade Plan</Button>
              </Link>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Current Usage</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monthly Expenses</span>
                <span>
                  {expenseCount} / {planDetails.limits.expensesPerMonth === -1 ? '∞' : planDetails.limits.expensesPerMonth}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Custom Categories</span>
                <span>
                  {categoryCount} / {planDetails.limits.customCategories === -1 ? '∞' : planDetails.limits.customCategories}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Plan Features</h4>
            <div className="space-y-2">
              {planDetails.features.slice(0, 5).map((feature, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldIcon className="mr-2 h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Export Your Data</h4>
            <p className="text-sm text-gray-500 mb-4">
              Download all your expense data in CSV format for backup or analysis
            </p>
            <Button variant="outline">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Delete Account</h4>
            <p className="text-sm text-gray-500 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Sign-in Method</h4>
              <p className="text-sm text-gray-500">
                You're currently signed in with Google
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500 mb-3">
                Add an extra layer of security to your account
              </p>
              <Button variant="outline" disabled>
                Enable 2FA (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}