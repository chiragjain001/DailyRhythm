"use client";

import { useEffect } from "react";
import { safeSupabase } from "@/lib/supabaseClient";
import { setAuthSession } from "@/lib/auth-utils";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // User is logged in, save them to your app's state
          const user = {
            id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata?.full_name?.split(' ')[0],
            last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setAuthSession(session.access_token, user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
