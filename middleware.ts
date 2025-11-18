import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const protectedPaths = ["/booking", "/admin", "/barber"] // adjust as needed
  const pathname = req.nextUrl.pathname

  if (protectedPaths.some(p => pathname.startsWith(p))) {
    const token = req.cookies.get("firebase-token")
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/booking/:path*","/admin/:path*","/barber/:path*"]
}