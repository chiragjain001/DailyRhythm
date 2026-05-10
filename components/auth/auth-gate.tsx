"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSupabase } from "../supabase-provider"
import { safeSupabase } from "@/lib/supabaseClient"
import type { Session, Subscription } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

type AuthGateProps = {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthGate({ children, redirectTo = "/auth" }: AuthGateProps) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await safeSupabase.auth.getSession()
        if (error && error.message !== 'Rate limit exceeded') {
          console.error('Error getting session:', error)
          router.push(redirectTo)
          return
        }
        setSession(session)
        if (!session) {
          router.push(redirectTo)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        router.push(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push(redirectTo)
      }
    })

    setSubscription(authListener.subscription)

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [supabase, router, redirectTo, subscription])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
