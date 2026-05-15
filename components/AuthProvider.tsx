"use client";

import React, { useEffect, useState } from "react";
import { safeSupabase } from "@/lib/supabaseClient";
import { setAuthSession, clearAuthSession } from "@/lib/auth-utils";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Logo } from "./logo";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initial session check
    safeSupabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user = {
          id: session.user.id,
          email: session.user.email,
          first_name: session.user.user_metadata?.full_name?.split(' ')[0],
          last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        setAuthSession(session.access_token, user as any);
      }
      setIsInitialized(true);
    });

    const { data: { subscription } } = safeSupabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = {
            id: session.user.id,
            email: session.user.email,
            first_name: session.user.user_metadata?.full_name?.split(' ')[0],
            last_name: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          setAuthSession(session.access_token, user as any);
        } else if (event === 'SIGNED_OUT') {
          clearAuthSession();
          router.replace('/auth');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const isProtectedRoute = ['/dashboard', '/setup-profile', '/account'].some(route => pathname?.startsWith(route));
  
  if (!isInitialized && isProtectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#fdf6ec] to-[#f4f1fe]">
        <div className="flex flex-col items-center gap-4">
           <div className="animate-pulse">
            <Logo />
          </div>
          <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
