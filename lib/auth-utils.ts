import { safeStorage } from './safeStorage';
import { md5 } from './md5';

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

/**
 * Seamlessly returns the user's profile avatar:
 * 1. Custom avatar_url (manual storage or high-res Google OAuth)
 * 2. Dynamic Gravatar via the user's email MD5 hash
 * 3. Branded high-res UI-Avatar fallback (MindSync theme)
 */
export function getUserAvatarUrl(user: AuthUser | null | undefined): string {
  if (!user) {
    return `https://ui-avatars.com/api/?name=User&background=1F2F4A&color=fff&size=200&bold=true`;
  }

  // If an explicit URL is stored, use it (Supabase storage OR OAuth URL)
  if (user.avatar_url) {
    return user.avatar_url;
  }

  const name = user.username || user.first_name || (user.email ? user.email.split('@')[0] : 'User');
  const formattedName = encodeURIComponent(name.trim());
  
  // Branded fallback: MindSync dark blue theme
  const fallback = encodeURIComponent(`https://ui-avatars.com/api/?name=${formattedName}&background=1F2F4A&color=fff&size=200&bold=true`);

  if (user.email) {
    const hash = md5(user.email);
    // Gravatar checks for real photo, fallbacks to gorgeous UI avatar if not found!
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=${fallback}`;
  }

  // Default if email not available
  return `https://ui-avatars.com/api/?name=${formattedName}&background=1F2F4A&color=fff&size=200&bold=true`;
}

