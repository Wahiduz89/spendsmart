import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APP_NAME } from '@/lib/constants'
import { CheckIcon, StarIcon } from 'lucide-react'

const features = [
  {
    title: 'UPI & Wallet Tracking',
    description: 'Track all your digital payments including UPI, Paytm, PhonePe, and more',
    icon: '📱',
  },
  {
    title: 'Smart Categories',
    description: 'Pre-configured categories for Indian spending patterns with auto-categorization',
    icon: '🏷️',
  },
  {
    title: 'Budget Alerts',
    description: 'Set monthly budgets and get alerts before you overspend',
    icon: '🎯',
  },
  {
    title: 'Visual Reports',
    description: 'Beautiful charts and insights to understand your spending habits',
    icon: '📊',
  },
  {
    title: 'Multi-device Sync',
    description: 'Access your data securely from any device, anywhere',
    icon: '☁️',
  },
  {
    title: 'Export & Backup',
    description: 'Export your data to Excel or PDF for tax filing and record keeping',
    icon: '💾',
  },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Software Engineer, Bengaluru',
    content: 'Finally, an expense tracker that understands Indian payment methods! Tracking my UPI transactions has never been easier.',
    rating: 5,
  },
  {
    name: 'Rahul Mehta',
    role: 'Small Business Owner, Mumbai',
    content: 'The budget alerts have helped me save ₹15,000 per month. Best investment for my financial health!',
    rating: 5,
  },
  {
    name: 'Anjali Patel',
    role: 'Marketing Manager, Delhi',
    content: 'Love the pre-configured categories for Indian expenses. From EMIs to grocery, everything is covered!',
    rating: 5,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">💰</span>
              <span className="font-display text-xl font-bold text-primary-600">
                {APP_NAME}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Smart Expense Tracking for
            <span className="gradient-text"> Modern Indians</span>
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Track UPI, wallets, and cash expenses effortlessly. Get insights that help you save more and spend wisely.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              No credit card required • Free forever for basic use
            </p>
          </div>
        </div>

        {/* Hero Image/Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600">50K+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600">₹2.5Cr+</div>
            <div className="text-gray-600">Expenses Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600">4.8/5</div>
            <div className="text-gray-600">User Rating</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need to Master Your Money
          </h2>
          <p className="text-xl text-gray-600">
            Built specifically for the Indian market with features you'll actually use
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Loved by Indians Everywhere
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who've transformed their financial habits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">
            Start Your Financial Journey Today
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Free to use, no credit card required. Upgrade anytime for advanced features.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">💰</span>
                <span className="font-display text-xl font-bold">
                  {APP_NAME}
                </span>
              </div>
              <p className="text-gray-400">
                Smart expense tracking for modern Indians
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 {APP_NAME}. Made with ❤️ in India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}