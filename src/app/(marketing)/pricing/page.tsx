import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLANS, APP_NAME } from '@/lib/constants'
import { CheckIcon, XIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: `Pricing | ${APP_NAME}`,
  description: 'Choose the perfect plan for your expense tracking needs',
}

const planFeatures = {
  FREE: {
    included: [
      'Track up to 50 expenses per month',
      'Basic expense categories',
      'Monthly spending reports',
      'Single device sync',
      'Email support',
    ],
    excluded: [
      'Unlimited expense tracking',
      'Custom categories',
      'Advanced analytics',
      'Receipt photo storage',
      'Priority support',
    ],
  },
  PREMIUM: {
    included: [
      'Unlimited expense tracking',
      'Unlimited custom categories',
      'Advanced analytics & insights',
      'Multi-device sync',
      'Export to Excel/PDF',
      'Receipt photo storage',
      'Budget alerts',
      'Priority support',
      'Financial year reports',
      'Spending predictions',
    ],
    excluded: [
      'Team collaboration',
      'API access',
      'Custom integrations',
    ],
  },
  ENTERPRISE: {
    included: [
      'Everything in Premium',
      'Team collaboration',
      'Admin dashboard',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Custom branding',
      'Advanced security',
      'SLA guarantee',
      'Training sessions',
    ],
    excluded: [],
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="font-display text-xl font-bold text-primary-600">
                {APP_NAME}
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mt-2">
                Perfect for getting started
              </p>
            </CardHeader>
            <CardContent>
              <Link href="/signin">
                <Button variant="outline" className="w-full mb-6">
                  Get Started
                </Button>
              </Link>
              
              <div className="space-y-3">
                {planFeatures.FREE.included.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {planFeatures.FREE.excluded.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2 opacity-50">
                    <XIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm line-through">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-primary-500 shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹199</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mt-2">
                For serious expense tracking
              </p>
            </CardHeader>
            <CardContent>
              <Link href="/signin">
                <Button className="w-full mb-6">
                  Start Free Trial
                </Button>
              </Link>
              
              <div className="space-y-3">
                {planFeatures.PREMIUM.included.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹999</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 mt-2">
                For teams and businesses
              </p>
            </CardHeader>
            <CardContent>
              <Link href="/signin">
                <Button variant="outline" className="w-full mb-6">
                  Contact Sales
                </Button>
              </Link>
              
              <div className="space-y-3">
                {planFeatures.ENTERPRISE.included.slice(0, 8).map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial for Premium?</h3>
              <p className="text-gray-600">
                Yes, we offer a 14-day free trial for Premium. No credit card required to start.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit/debit cards, UPI, Net Banking, and popular wallets like Paytm and PhonePe.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Can I export my data if I cancel?</h3>
              <p className="text-gray-600">
                Absolutely! You can export all your data in CSV or PDF format anytime, even after cancellation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}