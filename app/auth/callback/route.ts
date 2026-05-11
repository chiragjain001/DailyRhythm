import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // No code — redirect to auth with error
    return NextResponse.redirect(`${origin}/auth?error=no_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user) {
    console.error('[OAuth Callback] Error exchanging code:', error?.message)
    return NextResponse.redirect(`${origin}/auth?error=oauth_failed`)
  }

  const user = data.user

  // Check if the user has a completed profile in the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed, username')
    .eq('id', user.id)
    .maybeSingle()

  // Build the custom auth_token cookie so our custom middleware can protect routes
  const customToken = data.session?.access_token ?? 'oauth_session'

  // Determine redirect destination
  const profileComplete = profile?.profile_completed === true
  const redirectTo = profileComplete ? `${origin}/dashboard` : `${origin}/setup-profile`

  const response = NextResponse.redirect(redirectTo)

  // Set the custom auth_token cookie that our middleware reads
  response.cookies.set('auth_token', customToken, {
    httpOnly: false, // needs to be readable by client too (auth-utils reads it)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}
