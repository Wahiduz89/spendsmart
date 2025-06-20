import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency for Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format Indian number system (lakhs and crores)
export function formatIndianNumber(num: number): string {
  const formatter = new Intl.NumberFormat('en-IN')
  return formatter.format(num)
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(d)
}

// Get financial year for Indian context (April to March)
export function getFinancialYear(date: Date = new Date()): { start: Date; end: Date; label: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  let financialYear: number
  if (month >= 3) { // April (3) onwards
    financialYear = year
  } else {
    financialYear = year - 1
  }
  
  return {
    start: new Date(financialYear, 3, 1), // April 1st
    end: new Date(financialYear + 1, 2, 31), // March 31st
    label: `FY ${financialYear}-${(financialYear + 1).toString().slice(-2)}`
  }
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Validate Indian phone number
export function validateIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

// Generate a random color for categories
export function generateCategoryColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#A29BFE', '#FD79A8', '#00B894'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}