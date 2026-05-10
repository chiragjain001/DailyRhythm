"use client"

import { useState, useEffect } from "react"
import { greetingByTime } from "@/store/use-mindmate-store"
import { supabase } from "@/lib/supabaseClient"

export function Greet() {
  const greet = greetingByTime()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Handle JWT/user mismatch error
        if (sessionError?.message?.includes('User from sub claim in JWT does not exist')) {
          console.warn('Invalid JWT detected, signing out...')
          await supabase.auth.signOut()
          setUser(null)
          return
        }
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            ...profile
          })
        }
      } catch (error: any) {
        console.error('Error loading user:', error)
        
        // Handle JWT errors by signing out
        if (error?.message?.includes('User from sub claim in JWT does not exist')) {
          await supabase.auth.signOut()
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          ...profile
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Determine the display name with priority: first_name > username > fallback
  const getDisplayName = () => {
    if (loading) return "..."
    if (!user) return "Guest"
    
    // Use first_name if available, otherwise username, otherwise fallback
    return user.first_name || user.username || user.name || "Friend"
  }

  return (
    <div className="mb-1 flex items-center justify-between">
      <div>
        <h1 className="text-pretty text-2xl font-semibold text-neutral-900 md:text-3xl">
          {greet}, {getDisplayName()}
        </h1>
      </div>
    </div>
  )
}
