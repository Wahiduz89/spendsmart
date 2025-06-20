import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Middleware for soft deletes (if needed in future)
// prisma.$use(async (params, next) => {
//   // Add your middleware logic here
//   return next(params)
// })