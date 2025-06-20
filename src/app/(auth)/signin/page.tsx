'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/constants'
import { toast } from 'react-hot-toast'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      toast.error('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <span className="text-4xl">💰</span>
            <span className="font-display text-3xl font-bold text-primary-600">
              {APP_NAME}
            </span>
          </Link>
          <p className="mt-2 text-gray-600">
            Welcome back! Sign in to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base"
              variant="outline"
            >
              {isLoading ? (
                <span className="loading-spinner mr-2" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Secure Sign In
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Your data is encrypted and secure</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>We never share your financial information</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Sign out anytime from any device</span>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>
                Don't have an account?{' '}
                <Link href="/signin" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign up for free
                </Link>
              </p>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p>
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-gray-700">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}