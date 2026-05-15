"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, User, Shield, Edit2, Loader2 } from "lucide-react"
import { getCurrentUser, AuthUser, getUserAvatarUrl } from "@/lib/auth-utils"
import { toast } from "sonner"
import { uploadAvatar, upsertProfile } from "@/lib/profile"

interface AccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountModal({ open, onOpenChange }: AccountModalProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [tempUsername, setTempUsername] = useState("")
  const [tempEmail, setTempEmail] = useState("")

  // Load user profile data
  useEffect(() => {
    if (!open) return

    async function loadUserProfile() {
      try {
        const authUser = await getCurrentUser()
        if (authUser) {
          setCurrentUser(authUser)
          setTempUsername(authUser.username || authUser.first_name || "")
          setTempEmail(authUser.email || "")
        }
      } catch (error) {
        console.error('Error loading user profile:', error)
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [open])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    try {
      setUploading(true)
      
      // 1. Upload directly to Supabase Storage
      const { data, error: uploadError } = await uploadAvatar(file, currentUser.id)
      if (uploadError || !data) throw new Error(uploadError ? String(uploadError) : 'Upload failed')
      
      // 2. Save the new avatar_url inside profiles table
      const { error: updateError } = await upsertProfile({
        id: currentUser.id,
        avatar_url: data.url
      })
      if (updateError) throw updateError

      // 3. Reflect change on Client Store & UI state
      setCurrentUser({ ...currentUser, avatar_url: data.url })
      
      // Sync with local storage cached session
      const stored = localStorage.getItem('dailyrhythm_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.avatar_url = data.url
        localStorage.setItem('dailyrhythm_user', JSON.stringify(parsed))
      }
      
      toast.success("Profile photo updated successfully!")
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || "Failed to upload profile photo")
    } finally {
      setUploading(false)
    }
  }

  const handleUsernameUpdate = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      
      // Update profile in Supabase profiles table
      const { error } = await upsertProfile({
        id: currentUser.id,
        username: tempUsername
      })
      if (error) throw error
      
      setCurrentUser({ ...currentUser, username: tempUsername })
      
      // Sync cached storage session
      const stored = localStorage.getItem('dailyrhythm_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.username = tempUsername
        localStorage.setItem('dailyrhythm_user', JSON.stringify(parsed))
      }

      setEditingUsername(false)
      toast.success("Username updated successfully!")
    } catch (error: any) {
      console.error('Error updating username:', error)
      toast.error(error.message || "Failed to update username")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailUpdate = async () => {
    if (!currentUser) return

    try {
      // MOCK: Replace with custom backend email update logic
      const res = await fetch('/api/user/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail })
      })
      if (!res.ok) throw new Error('Failed to update email')
      
      setEditingEmail(false)
      toast.success("Email update initiated! Check your new email for confirmation.")
    } catch (error) {
      console.error('Error updating email:', error)
      toast.error("Failed to update email")
    }
  }

  const getDisplayName = () => {
    if (currentUser?.first_name && currentUser?.last_name) {
      return `${currentUser.first_name} ${currentUser.last_name}`
    }
    if (currentUser?.username) {
      return currentUser.username
    }
    return currentUser?.first_name || currentUser?.email?.split('@')[0] || "User"
  }

  const getUserInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[720px] md:max-w-[880px] lg:max-w-[1000px] max-h-[90vh] md:max-h-[85vh] lg:max-h-[80vh] overflow-hidden p-0 gap-0 flex flex-col md:flex-row rounded-xl">
        {/* Header - Mobile Only */}
        <DialogHeader className="md:hidden px-4 py-3 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">Account</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage your account info.</p>
            </div>
            
          </div>
        </DialogHeader>

        {/* Content */}
        <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-[200px] lg:w-[240px] xl:w-[280px] md:min-w-[200px] md:max-w-[35%] flex-shrink-0 bg-gray-50 border-r border-gray-200">
            {/* Desktop Close Button */}
            <div className="hidden md:flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold">Account</h2>
                <p className="text-sm text-muted-foreground">Manage your account info.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <TabsList className="grid w-full grid-cols-2 md:grid-rows-2 md:grid-cols-1 h-auto m-4 bg-transparent">
              <TabsTrigger value="profile" className="flex items-center gap-2 justify-center md:justify-start text-sm py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 justify-center md:justify-start text-sm py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white overflow-y-auto p-4 md:p-6 lg:p-8 xl:p-9">
            <TabsContent value="profile" className="mt-0 data-[state=inactive]:hidden">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Profile details</h3>
                
                {/* Profile Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Profile</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 relative overflow-hidden">
                          <AvatarImage 
                            src={getUserAvatarUrl(currentUser)} 
                            alt="Profile"
                            className="object-cover w-full h-full"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                            {getUserInitials(getDisplayName())}
                          </AvatarFallback>
                          {uploading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                              <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                            </div>
                          )}
                        </Avatar>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={handleAvatarUpload}
                        />
                      </div>
                      <span className="font-medium">{getDisplayName()}</span>
                    </div>
                    {/* Custom Upload hidden - avatar generated dynamically from email */}
                  </div>
                </div>

                {/* Username Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Username</Label>
                  <div className="flex items-center justify-between">
                    {editingUsername ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value)}
                          className="flex-1 text-sm"
                        />
                        <Button size="sm" onClick={handleUsernameUpdate} className="text-xs">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingUsername(false)
                          setTempUsername(currentUser?.username || currentUser?.first_name || "")
                        }} className="text-xs">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{currentUser?.username || currentUser?.first_name || "User"}</span>
                        <Button variant="link" size="sm" onClick={() => setEditingUsername(true)} className="text-blue-600 text-sm">
                          Update username
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Email Addresses Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Email addresses</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{currentUser?.email}</span>
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    </div>
                    {editingEmail ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          className="w-48 text-sm"
                        />
                        <Button size="sm" onClick={handleEmailUpdate} className="text-xs">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingEmail(false)
                          setTempEmail(currentUser?.email || "")
                        }} className="text-xs">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setEditingEmail(true)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button variant="link" size="sm" className="text-blue-600 text-sm p-0 h-auto justify-start">
                    <span className="mr-2">+</span>
                    Add email address
                  </Button>
                </div>

                {/* Connected Accounts Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Connected accounts</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                      <span className="text-sm">Google • {currentUser?.email}</span>
                    </div>
                  </div>
                  <Button variant="link" size="sm" className="text-blue-600 text-sm p-0 h-auto justify-start">
                    <span className="mr-2">+</span>
                    Connect account
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-0 data-[state=inactive]:hidden">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your password and security settings.
                </p>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Password</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Change your password to keep your account secure.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-sm">
                      Change password
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
