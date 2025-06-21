'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  HomeIcon, 
  WalletIcon, 
  TargetIcon, 
  ChartBarIcon, 
  CogIcon,
  X  // Changed from XMarkIcon to X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Expenses', href: '/expenses', icon: WalletIcon },
  { name: 'Budgets', href: '/budgets', icon: TargetIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="font-display text-xl font-bold text-primary-600">
                SpendSmart
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />  {/* Changed from XMarkIcon to X */}
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => onClose()}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Bottom section */}
          <div className="border-t border-gray-200 p-4">
            <div className="rounded-lg bg-primary-50 p-4">
              <h3 className="text-sm font-medium text-primary-900">
                Upgrade to Premium
              </h3>
              <p className="mt-1 text-xs text-primary-700">
                Unlock unlimited expenses, advanced analytics, and more!
              </p>
              <Link href="/pricing">
                <Button size="sm" className="mt-3 w-full">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}