'use client';

import { supabase } from '@/lib/supabaseClient';

export function SignOutButton() {
  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  }
  return (
    <button onClick={handleSignOut} className="text-sm underline">
      Sign out
    </button>
  );
}
