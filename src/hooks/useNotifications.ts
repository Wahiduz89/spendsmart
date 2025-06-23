// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

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

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  retry: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications?page=1&limit=10', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error codes
        if (response.status === 412 && errorData.needsSetup) {
          // User needs setup - trigger auto-setup
          await fetch('/api/setup-user', { 
            method: 'GET',
            credentials: 'include' 
          })
          
          // Retry after setup
          setTimeout(() => fetchNotifications(), 1000)
          return
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      setRetryCount(0) // Reset retry count on success
      
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      setError(errorMessage)
      
      // Auto-retry with exponential backoff for certain errors
      if (retryCount < 3 && (
        errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('500')
      )) {
        const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchNotifications()
        }, delay)
      }
      
      console.error('Fetch notifications error:', fetchError)
    } finally {
      setIsLoading(false)
    }
  }, [session, status, retryCount])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Mark as read error:', error)
      toast.error('Failed to mark notification as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Mark all as read error:', error)
      toast.error('Failed to mark notifications as read')
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      const wasUnread = !notifications.find(n => n.id === notificationId)?.isRead
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Delete notification error:', error)
      toast.error('Failed to delete notification')
    }
  }, [notifications])

  const retry = useCallback(async () => {
    setRetryCount(0)
    await fetchNotifications()
  }, [fetchNotifications])

  // Initial fetch and periodic updates
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications()

      // Set up polling interval
      const interval = setInterval(fetchNotifications, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [status, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    retry,
  }
}