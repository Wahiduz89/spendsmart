'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { toast } from 'react-hot-toast'
import { BellIcon, MailIcon, SmartphoneIcon } from 'lucide-react'

interface NotificationPreferences {
  budgetAlerts: boolean
  budgetThreshold: number
  dailyDigest: boolean
  weeklyReport: boolean
  expenseReminders: boolean
  emailAlerts: boolean
  pushAlerts: boolean
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    budgetAlerts: true,
    budgetThreshold: 80,
    dailyDigest: false,
    weeklyReport: true,
    expenseReminders: true,
    emailAlerts: true,
    pushAlerts: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch current preferences
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (!response.ok) throw new Error('Failed to fetch preferences')
      
      const data = await response.json()
      setPreferences(data)
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Failed to load notification preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleThresholdChange = (value: number[]) => {
    setPreferences(prev => ({
      ...prev,
      budgetThreshold: value[0]
    }))
  }

  const savePreferences = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      
      if (!response.ok) throw new Error('Failed to save preferences')
      
      toast.success('Notification preferences saved')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="loading-spinner" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" id="notifications">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="mr-2 h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how and when you receive notifications about your expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Alerts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Budget Alerts</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="budgetAlerts" className="text-sm font-medium">
                  Budget Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Get notified when approaching or exceeding budget limits
                </p>
              </div>
              <Switch
                id="budgetAlerts"
                checked={preferences.budgetAlerts}
                onCheckedChange={() => handleToggle('budgetAlerts')}
              />
            </div>

            {preferences.budgetAlerts && (
              <div className="ml-4 space-y-2">
                <label className="text-sm font-medium">
                  Alert Threshold: {preferences.budgetThreshold}%
                </label>
                <Slider
                  value={[preferences.budgetThreshold]}
                  onValueChange={handleThresholdChange}
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  You'll be notified when spending reaches this percentage of your budget
                </p>
              </div>
            )}
          </div>

          <hr />

          {/* Reports & Summaries */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reports & Summaries</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="dailyDigest" className="text-sm font-medium">
                  Daily Digest
                </label>
                <p className="text-sm text-gray-500">
                  Receive a daily summary of your spending
                </p>
              </div>
              <Switch
                id="dailyDigest"
                checked={preferences.dailyDigest}
                onCheckedChange={() => handleToggle('dailyDigest')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="weeklyReport" className="text-sm font-medium">
                  Weekly Report
                </label>
                <p className="text-sm text-gray-500">
                  Get a detailed weekly spending analysis every Sunday
                </p>
              </div>
              <Switch
                id="weeklyReport"
                checked={preferences.weeklyReport}
                onCheckedChange={() => handleToggle('weeklyReport')}
              />
            </div>
          </div>

          <hr />

          {/* Reminders */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reminders</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="expenseReminders" className="text-sm font-medium">
                  Expense Tracking Reminders
                </label>
                <p className="text-sm text-gray-500">
                  Remind me to track expenses if I haven't in a few days
                </p>
              </div>
              <Switch
                id="expenseReminders"
                checked={preferences.expenseReminders}
                onCheckedChange={() => handleToggle('expenseReminders')}
              />
            </div>
          </div>

          <hr />

          {/* Delivery Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Delivery</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="emailAlerts" className="text-sm font-medium">
                  <MailIcon className="inline h-4 w-4 mr-1" />
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="emailAlerts"
                checked={preferences.emailAlerts}
                onCheckedChange={() => handleToggle('emailAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="pushAlerts" className="text-sm font-medium">
                  <SmartphoneIcon className="inline h-4 w-4 mr-1" />
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive push notifications on your device (coming soon)
                </p>
              </div>
              <Switch
                id="pushAlerts"
                checked={preferences.pushAlerts}
                onCheckedChange={() => handleToggle('pushAlerts')}
                disabled
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={savePreferences} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            View your notification history from the bell icon in the header
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Click the notification bell <BellIcon className="inline h-4 w-4 mx-1" /> in the top navigation to view and manage your notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}