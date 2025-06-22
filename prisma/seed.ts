import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B", isDefault: true },
  { name: "Transportation", icon: "🚗", color: "#4ECDC4", isDefault: true },
  { name: "Shopping", icon: "🛍️", color: "#45B7D1", isDefault: true },
  { name: "Bills & Utilities", icon: "💡", color: "#96CEB4", isDefault: true },
  { name: "Entertainment", icon: "🎬", color: "#FECA57", isDefault: true },
  { name: "Healthcare", icon: "🏥", color: "#FF9FF3", isDefault: true },
  { name: "Education", icon: "📚", color: "#54A0FF", isDefault: true },
  { name: "Personal Care", icon: "💅", color: "#A29BFE", isDefault: true },
  { name: "Groceries", icon: "🛒", color: "#FD79A8", isDefault: true },
  { name: "EMI", icon: "🏦", color: "#636E72", isDefault: true },
  { name: "Investments", icon: "📈", color: "#00B894", isDefault: true },
  { name: "Others", icon: "📋", color: "#B2BEC3", isDefault: true },
]

async function main() {
  console.log('🌱 Starting seed...')

  try {
    // Get all users
    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} users`)

    for (const user of users) {
      console.log(`Processing user: ${user.email}`)

      // Check if user already has categories
      const existingCategories = await prisma.category.count({
        where: { userId: user.id }
      })

      if (existingCategories === 0) {
        console.log(`Creating default categories for ${user.email}...`)
        
        // Create default categories
        await prisma.category.createMany({
          data: defaultCategories.map(category => ({
            ...category,
            userId: user.id
          }))
        })
        
        console.log(`✅ Created ${defaultCategories.length} categories`)
      } else {
        console.log(`User already has ${existingCategories} categories`)
      }

      // Check if user has subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id }
      })

      if (!subscription) {
        console.log(`Creating subscription for ${user.email}...`)
        
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'FREE',
            status: 'active'
          }
        })
        
        console.log(`✅ Created subscription`)
      }

      // Optional: Create sample expenses for testing
      const expenseCount = await prisma.expense.count({
        where: { userId: user.id }
      })

      if (expenseCount === 0 && process.env.CREATE_SAMPLE_DATA === 'true') {
        console.log(`Creating sample expenses for ${user.email}...`)
        
        const categories = await prisma.category.findMany({
          where: { userId: user.id }
        })

        const sampleExpenses = [
          {
            description: "Lunch at restaurant",
            amount: 450,
            categoryId: categories.find(c => c.name === "Food & Dining")?.id,
            paymentMethod: "UPI" as const,
            merchant: "Swiggy",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
          },
          {
            description: "Uber ride to office",
            amount: 150,
            categoryId: categories.find(c => c.name === "Transportation")?.id,
            paymentMethod: "WALLET" as const,
            merchant: "Uber",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            description: "Grocery shopping",
            amount: 1200,
            categoryId: categories.find(c => c.name === "Groceries")?.id,
            paymentMethod: "DEBIT_CARD" as const,
            merchant: "BigBasket",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          {
            description: "Movie tickets",
            amount: 500,
            categoryId: categories.find(c => c.name === "Entertainment")?.id,
            paymentMethod: "CREDIT_CARD" as const,
            merchant: "PVR Cinemas",
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            description: "Electricity bill",
            amount: 2500,
            categoryId: categories.find(c => c.name === "Bills & Utilities")?.id,
            paymentMethod: "NET_BANKING" as const,
            merchant: "Electricity Bill",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
          }
        ]

        for (const expense of sampleExpenses) {
          if (expense.categoryId) {
            await prisma.expense.create({
              data: {
                ...expense,
                userId: user.id
              }
            })
          }
        }
        
        console.log(`✅ Created ${sampleExpenses.length} sample expenses`)
      }
    }

    console.log('✅ Seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })