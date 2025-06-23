'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { BellIcon, CheckIcon, TrashIcon, AlertCircleIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  createdAt: string
  relatedId?: string
  relatedType?: string
}

export function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      if (pageNum === 1) {
        setNotifications(data.notifications)
      } else {
        setNotifications(prev => [...prev, ...data.notifications])
      }
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and periodic polling
  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(1)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })
      
      if (!response.ok) throw new Error('Failed to mark as read')
      
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      
      if (!response.ok) throw new Error('Failed to mark all as read')
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark notifications as read')
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete notification')
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (!notifications.find(n => n.id === notificationId)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Navigate to related item
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    if (notification.relatedType === 'budget' && notification.relatedId) {
      router.push('/budgets')
    } else if (notification.relatedType === 'expense' && notification.relatedId) {
      router.push(`/expenses/${notification.relatedId}`)
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BUDGET_WARNING':
      case 'BUDGET_EXCEEDED':
        return '⚠️'
      case 'EXPENSE_REMINDER':
        return '💡'
      case 'WEEKLY_SUMMARY':
      case 'MONTHLY_SUMMARY':
        return '📊'
      case 'ACHIEVEMENT':
        return '🏆'
      default:
        return '📢'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'text-red-600 bg-red-50'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[480px] custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">We'll notify you when something important happens</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                        !notification.isRead && "bg-blue-50"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  getPriorityColor(notification.priority)
                                )}>
                                  {notification.priority}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                              >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    router.push('/settings#notifications')
                    setIsOpen(false)
                  }}
                >
                  Notification Settings
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}