'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from 'react-hot-toast'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header />
        
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {/* Mobile menu button */}
            <div className="sticky top-0 z-10 bg-gray-50 px-4 py-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Page content */}
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  )
}