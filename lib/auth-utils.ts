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
  const userStr = safeStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
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
  // Clear the cookie instantly
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
