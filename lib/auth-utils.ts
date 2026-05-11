import { safeStorage } from './safeStorage';

export interface AuthUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  profile_completed?: boolean;
}

const TOKEN_KEY = 'mindsync_token';
const USER_KEY = 'mindsync_user';

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check custom localStorage session first (email/password login)
  const userStr = safeStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      // bad JSON — fall through
    }
  }

  // 2. Fall back to reading the Supabase session from cookies if available
  //    This covers the OAuth flow where we set auth_token but not mindsync_user.
  try {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const authUser: AuthUser = {
        id: user.id,
        email: user.email ?? undefined,
        first_name: user.user_metadata?.full_name?.split(' ')[0] ?? undefined,
        last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? undefined,
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
        profile_completed: false, // will be overridden by profile fetch
      };
      // Cache into localStorage so next call is instant
      safeStorage.setItem(USER_KEY, JSON.stringify(authUser));
      return authUser;
    }
  } catch {
    // Supabase not configured or network error — ignore
  }

  return null;
}

export function setAuthSession(token: string, user: AuthUser) {
  safeStorage.setItem(TOKEN_KEY, token);
  safeStorage.setItem(USER_KEY, JSON.stringify(user));

  // Also set cookie for middleware to instantly read for route protection
  document.cookie = `auth_token=${token}; path=/; max-age=604800; samesite=lax`;
}

export async function signOut(): Promise<void> {
  safeStorage.removeItem(TOKEN_KEY);
  safeStorage.removeItem(USER_KEY);

  // Also sign out from Supabase to invalidate the OAuth session
  try {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  // Clear the custom cookie
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}

export async function redirectToAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}
