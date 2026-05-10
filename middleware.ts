import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });
  
  const path = req.nextUrl.pathname;

  // Allow static files and API routes
  if (staticFilePatterns.some(pattern => path.startsWith(pattern)) || 
      path.includes('.')) {
    return res;
  }

  // Allow public paths
  if (publicPaths.some(p => path.startsWith(p))) {
    return res;
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  try {
    // Get current session with rate limiting protection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      
      // Handle rate limiting errors
      if (sessionError.message?.includes('Request rate limit reached') || 
          sessionError.code === 'over_request_rate_limit') {
        console.warn('Rate limit reached in middleware, allowing request to proceed');
        return res; // Allow request to proceed to avoid blocking users
      }
      
      // Handle JWT/user mismatch by clearing session and redirecting
      if (sessionError.message?.includes('User from sub claim in JWT does not exist') ||
          sessionError.message?.includes('Refresh Token Not Found')) {
        const response = NextResponse.redirect(new URL('/auth', req.url));
        // Clear auth cookies
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }
      
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    // Redirect unauthenticated users to auth page
    if (!session?.user) {
      const redirectUrl = new URL('/auth', req.url);
      redirectUrl.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Handle authenticated users trying to access auth page
    if (path === '/auth') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check profile completion for protected routes
    if (path === '/dashboard' || path.startsWith('/setup-profile')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completed')
        .eq('id', session.user.id)
        .single();

      const isProfileComplete = profile?.profile_completed;

      // Redirect to setup if profile is not complete
      if (!isProfileComplete && !path.startsWith('/setup-profile')) {
        return NextResponse.redirect(new URL('/setup-profile', req.url));
      }

      // Redirect to dashboard if profile is complete and user is on setup page
      if (isProfileComplete && path.startsWith('/setup-profile')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/auth', req.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
