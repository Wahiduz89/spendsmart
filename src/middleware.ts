import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/signin",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/budgets/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/expenses/:path*",
    "/api/categories/:path*",
    "/api/budgets/:path*",
  ],
}