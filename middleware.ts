import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for admin registration and root admin page
  if (request.nextUrl.pathname === '/admin/register' || request.nextUrl.pathname === '/admin') {
    return NextResponse.next()
  }

  // Check if the route is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get the Firebase auth token from the cookie
    const token = request.cookies.get('firebase-token')

    if (!token) {
      // If no token exists, redirect to login with a return path
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', 'admin')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
} 