import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect to profile completion if profile doesn't exist
    if (
      token &&
      !path.startsWith("/profile/complete") &&
      !path.startsWith("/api") &&
      !path.startsWith("/login") &&
      !path.startsWith("/register")
    ) {
      // This check should be done via API, but for now we'll allow access
      // In production, you'd check if playerProfile exists
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public paths
        if (
          path === "/" ||
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/api/auth")
        ) {
          return true
        }

        // Protected paths require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
