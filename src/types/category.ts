export interface Category {
    id: string
    userId: string
    name: string
    icon?: string | null
    color?: string | null
    isDefault: boolean
    createdAt: Date | string
    updatedAt: Date | string
    _count?: {
      expenses: number
    }
    monthlySpending?: number
  }
  
  export interface CategoryFormData {
    name: string
    icon?: string
    color?: string
  }
  
  export interface CategoryWithStats extends Category {
    expenseCount: number
    totalSpent: number
    percentageOfTotal: number
  }