"use client"

import React, { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Home, Cog, Trophy, ChevronLeft, ChevronRight, CalendarDays, Leaf, User, LogOut, Settings, Download } from "lucide-react"
import { Logo } from "./logo"
import { greetingByTime, useMindmateStore } from "@/store/use-mindmate-store"
import { format } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { AccountModal } from "@/components/account-modal"
import { DataExportModal } from "@/components/data-export-modal"
import { NotificationToggle } from "@/components/notification-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export function Topbar() {
  const { selectedDate, prevDay, nextDay, today } = useMindmateStore()
  const router = useRouter()
  const greet = greetingByTime()
  const dateLabel = format(new Date(selectedDate), "EEE, MMM d")

  const [activeButton, setActiveButton] = useState<string | null>(null)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
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
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleButtonClick = (buttonName: string) => {
    setActiveButton(buttonName === activeButton ? null : buttonName)
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleManageAccount = () => {
    console.log('Opening account modal...')
    setAccountModalOpen(true)
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user?.username) {
      return user.username
    }
    return user?.name || user?.email?.split('@')[0] || "User"
  }

  // Get avatar URL
  const getAvatarUrl = () => {
    return user?.avatar_url || "/placeholder.svg?height=64&width=64"
  }

  return (
    <>
      <style>{`
        .active-button-bg {
          background-image: linear-gradient(135deg, #9ACD32, #FF6B9D) !important;
          border-radius: 50% !important;
        }
      `}</style>
      <header className="sticky top-0 z-10 h-16 w-full rounded-b-3xl bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-2">
          {/* Left section */}
          <div className="flex flex-1 items-center gap-6">
            <Logo />
            <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 flex items-center gap-3">
              <CalendarDays className="inline h-4 w-4 text-neutral-500" />
              <span className="text-neutral-700">{dateLabel}</span>
              <Button variant="secondary" className="rounded-full" onClick={today}>
                Today
              </Button>
            </div>
            
          </div>

          {/* Center section */}
          <div className="flex flex-1 justify-center items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Home"
              className={`hidden md:inline-flex ${activeButton === "home" ? "active-button-bg" : ""}`}
              onClick={() => handleButtonClick("home")}
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Leaf"
              className={`hidden md:inline-flex ${activeButton === "leaf" ? "active-button-bg" : ""}`}
              onClick={() => handleButtonClick("leaf")}
            >
              <Leaf className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Trophy"
              className={`hidden md:inline-flex ${activeButton === "trophy" ? "active-button-bg" : ""}`}
              onClick={() => handleButtonClick("trophy")}
            >
              <Trophy className="h-5 w-5" />
            </Button>
          </div>

          {/* Right section */}
          <div className="flex flex-1 justify-end items-center gap-3 px-2">
            <NotificationToggle />
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 flex items-center justify-center">
                  <Avatar className="h-9 w-9 ring-2 ring-neutral-200 hover:ring-neutral-300 transition-all cursor-pointer">
                    <AvatarImage 
                      src={getAvatarUrl()} 
                      alt="Profile" 
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium w-full h-full flex items-center justify-center">
                      {getUserInitials(getDisplayName())}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || greet}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleManageAccount} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Manage account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportModalOpen(true)} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  <span>Export data</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Account Modal */}
      <AccountModal 
        open={accountModalOpen} 
        onOpenChange={setAccountModalOpen} 
      />
      
      {/* Data Export Modal */}
      <DataExportModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
      />
    </>
  )
}
