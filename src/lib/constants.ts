// Application metadata
export const APP_NAME = "SpendSmart India"
export const APP_DESCRIPTION = "Smart expense tracking for Indian users"
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spendsmart.in"

// Subscription plans
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Track up to 50 expenses per month',
      'Basic expense categories',
      'Monthly spending reports',
      'Single device sync',
      'Email support'
    ],
    limits: {
      expensesPerMonth: 50,
      customCategories: 5,
      budgets: 3,
      reportsHistory: 3, // months
    }
  },
  PREMIUM: {
    name: 'Premium',
    price: 199, // INR per month
    features: [
      'Unlimited expense tracking',
      'Unlimited custom categories',
      'Advanced analytics & insights',
      'Multi-device sync',
      'Export to Excel/PDF',
      'Receipt photo storage',
      'Budget alerts',
      'Priority support'
    ],
    limits: {
      expensesPerMonth: -1, // unlimited
      customCategories: -1,
      budgets: -1,
      reportsHistory: 12, // months
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 999, // INR per month
    features: [
      'Everything in Premium',
      'Team collaboration',
      'Admin dashboard',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Custom branding'
    ],
    limits: {
      expensesPerMonth: -1,
      customCategories: -1,
      budgets: -1,
      reportsHistory: -1, // unlimited
    }
  }
}

// Payment methods for Indian market
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
  { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
  { value: 'UPI', label: 'UPI', icon: '📱' },
  { value: 'WALLET', label: 'Digital Wallet', icon: '👛' },
  { value: 'NET_BANKING', label: 'Net Banking', icon: '🏦' },
  { value: 'OTHER', label: 'Other', icon: '📋' },
]

// Budget periods
export const BUDGET_PERIODS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
]

// Common expense merchants in India
export const COMMON_MERCHANTS = [
  // Food Delivery
  'Swiggy', 'Zomato', 'Dominos', 'Pizza Hut', 'McDonalds', 'KFC', 'Burger King',
  // E-commerce
  'Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa', 'BigBasket', 'Grofers',
  // Transportation
  'Ola', 'Uber', 'Rapido', 'Metro', 'Indian Railways', 'Petrol Pump',
  // Utilities
  'Electricity Bill', 'Water Bill', 'Gas Bill', 'Internet Bill', 'Mobile Recharge',
  // Entertainment
  'Netflix', 'Amazon Prime', 'Hotstar', 'PVR Cinemas', 'INOX',
  // Others
  'Medical Store', 'Grocery Store', 'Gym', 'Salon', 'School Fees'
]

// Chart colors
export const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#A29BFE', '#FD79A8', '#00B894',
  '#636E72', '#FDCB6E', '#6C5CE7', '#A8E6CF', '#FFD93D'
]

// SEO configuration
export const SEO_CONFIG = {
  title: `${APP_NAME} - Smart Expense Tracking for India`,
  description: 'Track your expenses, manage budgets, and gain financial insights with SpendSmart India. Built for the Indian market with UPI, wallet support, and local payment methods.',
  keywords: 'expense tracker india, budget app, money manager, expense management, upi tracking, indian expense app',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    handle: '@spendsmartindia',
    site: '@spendsmartindia',
    cardType: 'summary_large_image',
  },
}