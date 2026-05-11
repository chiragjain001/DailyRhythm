"use client"

import { useState, useEffect } from "react"
import { greetingByTime } from "@/store/use-mindmate-store"
import { getCurrentUser, AuthUser } from "@/lib/auth-utils"

export function Greet() {
  const greet = greetingByTime()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error: any) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Determine the display name
  const getDisplayName = () => {
    if (loading) return "..."
    if (!user) return "Guest"
    
    // Use first_name if available, otherwise username, otherwise fallback
    return user.first_name || user.username || user.email?.split('@')[0] || "Friend"
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
