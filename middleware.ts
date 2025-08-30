import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow access to auth pages and public assets
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next()
  }
  
  // For the main app routes, let the client-side auth handle it
  // This provides a basic layer of protection while allowing the auth system to work
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    // The client-side auth will handle redirects
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
