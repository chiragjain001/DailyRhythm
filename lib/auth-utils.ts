import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  profile_completed?: boolean;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Handle JWT/user mismatch error
    if (sessionError?.message?.includes('User from sub claim in JWT does not exist')) {
      console.warn('Invalid JWT detected, clearing session...');
      await supabase.auth.signOut();
      return null;
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email,
      ...profile
    };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    
    // Handle JWT errors by clearing the session
    if (error?.message?.includes('User from sub claim in JWT does not exist')) {
      await supabase.auth.signOut();
    }
    
    return null;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function redirectToAuth(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}
