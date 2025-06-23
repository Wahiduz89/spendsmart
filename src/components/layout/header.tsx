'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'Budgets', href: '/budgets' },
  { name: 'Reports', href: '/reports' },
]

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="font-display text-xl font-bold text-primary-600">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2",
                  pathname.startsWith(item.href)
                    ? "border-primary-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {session?.user && (
              <div className="flex items-center space-x-3">
                {/* Notification Bell */}
                <NotificationBell />
                
                <div className="h-8 w-px bg-gray-200" />
                
                {/* User Info */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user.email}
                  </p>
                </div>
                {session.user.image && (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              aria-label="Open menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}