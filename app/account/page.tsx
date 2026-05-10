"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Camera, User, Shield, Mail, Edit2, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { getProfile, upsertProfile, uploadAvatar, type ProfileRow } from "@/lib/profile"
import { AuthGate } from "@/components/auth/auth-gate"
import { toast } from "sonner"

export default function AccountPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingUsername, setEditingUsername] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [tempUsername, setTempUsername] = useState("")
  const [tempEmail, setTempEmail] = useState("")
  const [isClient, setIsClient] = useState(false)

  // Set client flag after component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load user profile data
  useEffect(() => {
    if (!isClient) return

    async function loadUserProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setCurrentUser(authUser)
          const { data: profileData } = await getProfile(authUser.id)
          if (profileData) {
            setProfile(profileData)
            setTempUsername(profileData.username || "")
          }
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
  }, [supabase, isClient])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser || !isClient) return

    try {
      setLoading(true)
      const { data: avatarData, error: uploadError } = await uploadAvatar(file, currentUser.id)
      
      if (uploadError) {
        throw new Error(uploadError)
      }
      
      if (avatarData && profile) {
        const updatedProfile = { ...profile, avatar_url: avatarData.url }
        await upsertProfile(updatedProfile)
        setProfile(updatedProfile)
        toast.success("Profile photo updated successfully!")
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error("Failed to upload profile photo")
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameUpdate = async () => {
    if (!profile || !currentUser || !isClient) return

    try {
      const updatedProfile = { ...profile, username: tempUsername }
      await upsertProfile(updatedProfile)
      setProfile(updatedProfile)
      setEditingUsername(false)
      toast.success("Username updated successfully!")
    } catch (error) {
      console.error('Error updating username:', error)
      toast.error("Failed to update username")
    }
  }

  const handleEmailUpdate = async () => {
    if (!currentUser || !isClient) return

    try {
      const { error } = await supabase.auth.updateUser({ email: tempEmail })
      if (error) throw error
      
      setEditingEmail(false)
      toast.success("Email update initiated! Check your new email for confirmation.")
    } catch (error) {
      console.error('Error updating email:', error)
      toast.error("Failed to update email")
    }
  }

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.username) {
      return profile.username
    }
    return currentUser?.email?.split('@')[0] || "User"
  }

  const getUserInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading || !isClient) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="w-full max-w-10xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Account</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage your account info.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <Tabs defaultValue="profile" orientation="vertical" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-rows-2 lg:grid-cols-1 h-auto">
                  <TabsTrigger value="profile" className="flex items-center gap-2 justify-center lg:justify-start text-sm">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2 justify-center lg:justify-start text-sm">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Security</span>
                  </TabsTrigger>
                </TabsList>

                {/* Main Content */}
                <div className="flex-1 mt-6 lg:mt-0 lg:ml-8">
                  <TabsContent value="profile" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                        {/* Profile Photo Section */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                              <AvatarImage 
                                src={profile?.avatar_url || "/placeholder.svg?height=80&width=80"} 
                                alt="Profile"
                                className="object-cover w-full h-full"
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-sm sm:text-lg">
                                {getUserInitials(getDisplayName())}
                              </AvatarFallback>
                            </Avatar>
                            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md border cursor-pointer hover:bg-gray-50">
                              <Camera className="h-3 w-3" />
                            </label>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                          </div>
                          <div className="text-center sm:text-left">
                            <h3 className="font-medium text-sm sm:text-base">{getDisplayName()}</h3>
                            <Button variant="outline" size="sm" className="mt-2 text-xs sm:text-sm">
                              <label htmlFor="avatar-upload" className="cursor-pointer">
                                Update profile
                              </label>
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        {/* Profile Information */}
                        <div className="space-y-4 sm:space-y-6">
                          <div>
                            <Label className="text-sm font-medium">Profile</Label>
                            <div className="mt-2 flex items-center gap-3 sm:gap-4">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarImage 
                                  src={profile?.avatar_url || "/placeholder.svg?height=40&width=40"} 
                                  alt="Profile"
                                  className="object-cover w-full h-full"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-xs sm:text-sm">
                                  {getUserInitials(getDisplayName())}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm sm:text-base truncate">{getDisplayName()}</span>
                            </div>
                          </div>

                          {/* Username */}
                          <div>
                            <Label className="text-sm font-medium">Username</Label>
                            <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {editingUsername ? (
                                <>
                                  <Input
                                    value={tempUsername}
                                    onChange={(e) => setTempUsername(e.target.value)}
                                    className="flex-1 text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUsernameUpdate} className="flex-1 sm:flex-none">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setEditingUsername(false)
                                      setTempUsername(profile?.username || "")
                                    }} className="flex-1 sm:flex-none">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm sm:text-base py-2 sm:py-0">{profile?.username || "Not set"}</span>
                                  <Button size="sm" variant="outline" onClick={() => setEditingUsername(true)} className="text-xs sm:text-sm">
                                    Update username
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Email Addresses */}
                          <div>
                            <Label className="text-sm font-medium">Email addresses</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                      <span className="text-sm sm:text-base truncate">{currentUser?.email}</span>
                                      <Badge variant="secondary" className="text-xs w-fit">Primary</Badge>
                                    </div>
                                  </div>
                                </div>
                                {editingEmail ? (
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                    <Input
                                      value={tempEmail}
                                      onChange={(e) => setTempEmail(e.target.value)}
                                      className="w-full sm:w-48 text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={handleEmailUpdate} className="flex-1 sm:flex-none">
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => {
                                        setEditingEmail(false)
                                        setTempEmail(currentUser?.email || "")
                                      }} className="flex-1 sm:flex-none">
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => setEditingEmail(true)} className="w-full sm:w-auto">
                                    <Edit2 className="h-4 w-4 sm:mr-0 mr-2" />
                                    <span className="sm:hidden">Edit email</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="security" className="mt-0">
                    <Card>
                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-lg sm:text-xl">Security</CardTitle>
                        <CardDescription className="text-sm">
                          Manage your password and security settings.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm sm:text-base">Password</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Change your password to keep your account secure.
                            </p>
                          </div>
                          <Button variant="outline" className="w-full sm:w-auto text-sm">
                            Change password
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
