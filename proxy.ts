import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/setup-profile', '/account']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth page — redirect to dashboard if already logged in
  const isAuthPage = pathname === '/auth'

  // Skip middleware for non-relevant paths early
  if (!isProtectedRoute && !isAuthPage) {
    return NextResponse.next()
  }

  // Check our custom auth_token cookie (email/password login)
  const customToken = request.cookies.get('auth_token')?.value

  // Also check Supabase session (OAuth login)
  let supabaseUser: any = null
  let response = NextResponse.next()

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    supabaseUser = user
  } catch {
    // Supabase not configured — skip
  }

  const isAuthenticated = Boolean(customToken) || Boolean(supabaseUser)

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  if (isAuthPage && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
