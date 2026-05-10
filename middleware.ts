import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Define public paths that don't require authentication
const publicPaths = [
  '/auth',
  '/auth/callback',
  '/reset-password',
  '/update-password'
];

// Define static file patterns
const staticFilePatterns = [
  '/_next/',
  '/favicon.ico',
  '/images/',
  '/icons/',
  '/api/'
];

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  });
  
  const path = req.nextUrl.pathname;

  // 1. Immediate Allow for static files and API routes
  if (staticFilePatterns.some(pattern => path.startsWith(pattern)) || path.includes('.')) {
    return supabaseResponse;
  }

  // 2. Create Supabase server client with robust cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Setting them on the request enables them to be available to down-stream hooks/loaders
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          // Refresh response object to include newly mutated request context
          supabaseResponse = NextResponse.next({
            request: req,
          });
          // Apply cookies to output response
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // 3. Critical: Use getUser() instead of getSession() for robust secure validation and automated background refreshes
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Allow non-authenticated traffic through only on declared public paths
    const isPublicPath = publicPaths.some(p => path.startsWith(p));

    // 4. Handle redirect logic
    if (!user) {
      if (!isPublicPath) {
        // Unauthorized user on private path -> redirect to auth
        const redirectUrl = new URL('/auth', req.url);
        redirectUrl.searchParams.set('redirectedFrom', path);
        return NextResponse.redirect(redirectUrl);
      }
      // Unauthorized but on a public path -> Allow
      return supabaseResponse;
    }

    // User is authorized below this point ─────────────────────────────

    // Prevent logged-in users from seeing login page again
    if (path === '/auth') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Perform profile check for major operational paths
    if (path === '/dashboard' || path.startsWith('/setup-profile')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', user.id)
        .single();

      // If profile fetch fails (e.g. database error or missing profile), defer to defaults safely
      const isProfileComplete = profile?.profile_completed;

      // Path protection based on profile completion state
      if (!isProfileComplete && !path.startsWith('/setup-profile')) {
        // Active session, incomplete profile -> force setup
        return NextResponse.redirect(new URL('/setup-profile', req.url));
      }

      if (isProfileComplete && path.startsWith('/setup-profile')) {
        // Completed profile should not land back in setup
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Return existing modified response preserving cookies and headers
    return supabaseResponse;

  } catch (error) {
    console.error('[Middleware] Error retrieving user context:', error);
    // In extreme failure, default to the auth page safely
    const isPublicPath = publicPaths.some(p => path.startsWith(p));
    if (isPublicPath) return supabaseResponse;
    return NextResponse.redirect(new URL('/auth', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
