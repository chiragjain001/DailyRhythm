'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabase } from '@/components/supabase-provider';
import { getProfile, upsertProfile, uploadAvatar, checkUsernameAvailable, type ProfileRow } from '@/lib/profile';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores are allowed'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SetupProfilePage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [available, setAvailable] = useState<{ available: boolean | null; error: string | null }>({ available: null, error: null });
  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema), 
    mode: 'onChange',
    defaultValues: {
      username: '',
      bio: ''
    }
  });

  const username = watch('username');

  // Load user profile on mount
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth');
          return;
        }

        setUserId(user.id);
        const { data: profile, error } = await getProfile(user.id);

        if (error) {
          console.error('Profile fetch error:', error);
          // Don't throw error if profile doesn't exist - this is normal for new users
          if (error.message && !error.message.includes('Database error')) {
            throw error;
          }
        }

        // If profile exists, populate the form
        if (profile) {
          setValue('username', profile.username || '');
          setValue('bio', profile.bio || '');
          
          if (profile.avatar_url) {
            setAvatarPreview(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, [router, setValue, supabase]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailable({ available: null, error: null });
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { available: isAvailable, error } = await checkUsernameAvailable(username, userId || undefined);
        setAvailable({ 
          available: isAvailable, 
          error: error || null 
        });
      } catch (err) {
        console.error('Error checking username:', err);
        setAvailable({ 
          available: false, 
          error: 'Error checking username availability' 
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, userId]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (2MB max)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('Image size too large. Maximum size is 2MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Create a blob for the cropped area
  const getCroppedBlob = useCallback(async (
    imageSrc: string,
    cropPixels: { x: number; y: number; width: number; height: number }
  ) => {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = cropPixels.width;
          canvas.height = cropPixels.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));

          ctx.drawImage(
            img,
            cropPixels.x,
            cropPixels.y,
            cropPixels.width,
            cropPixels.height,
            0,
            0,
            cropPixels.width,
            cropPixels.height
          );

          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed to create blob'));
            resolve(blob);
          }, 'image/jpeg', 0.9);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    });
  }, []);


  const canSubmit = useMemo(() => {
    return isValid && available.available !== false && !!userId && !saving;
  }, [isValid, available, userId, saving]);

  const onSubmit = handleSubmit(async (values) => {
    if (!userId) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    if (available.available === false) {
      toast.error('Username is already taken');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let avatarUrl: string | null = avatarPreview;

      // Handle avatar upload (respect crop if applied)
      if (file) {
        try {
          let uploadFile: File = file;
          if (avatarPreview && croppedAreaPixels) {
            const blob = await getCroppedBlob(avatarPreview, croppedAreaPixels);
            uploadFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          }

          const { data: uploadData, error: uploadError } = await uploadAvatar(uploadFile, userId);

          if (uploadError) throw uploadError;
          if (!uploadData?.url) throw new Error('Failed to upload avatar');
          
          avatarUrl = uploadData.url;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          throw new Error('Failed to upload profile picture. Please try again.');
        }
      }

      // Update the profile
      const { error: updateError } = await upsertProfile({
        id: userId,
        username: values.username,
        bio: values.bio || null,
        avatar_url: avatarUrl,
        profile_completed: true,
      });

      if (updateError) throw updateError;

      toast.success('Profile updated successfully!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
        <div className="text-center">
          <div className="logo mb-4">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">MindSync</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6C63FF] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-2">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden relative flex items-center justify-center py-12 px-6 text-gray-800 min-h-[200px]" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
        <div className="absolute inset-0"></div>
        <div className="relative z-10 text-center">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">MindSync</span>
          </div>
          
        </div>
      </div>

      {/* Desktop Left Panel - Hidden on mobile */}
      <div className="relative hidden lg:flex items-center justify-center p-6 xl:p-10 text-gray-800 overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage: 'url(/mind.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'blur(4px)', transform: 'scale(1.1)'}}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-black/30"></div>
        <div className="max-w-md space-y-6 relative z-10">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">MindSync</span>
          </div>
          <div>
            <h2 className="text-2xl xl:text-3xl font-bold mb-2">Complete Your Profile</h2>
            <p className="text-gray-700">Set up your profile to get started with MindSync.</p>
          </div>
          <div className="space-y-4 mt-8">
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 opacity-60">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">1</span>
                <div>
                  <p className="font-medium">Sign up your account</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">2</span>
                <div>
                  <p className="font-medium">Set up your profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center pt-4 pb-4 px-4 sm:items-center sm:p-6 md:p-8 lg:p-12 xl:p-20 min-h-[calc(100vh-120px)] lg:min-h-auto" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl p-6 sm:p-8 text-gray-800 animate-fade-in" style={{background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'}}>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">Set Up Profile</h1>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6">Complete your profile information to get started.</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl mb-4 sm:mb-6">
              <p className="font-medium">Setup Required</p>
              <p className="text-sm mt-1">{error}</p>
              {error.includes('Database setup required') && (
                <p className="text-xs mt-2 text-red-600">
                  Please run the SQL script from setup_database.sql in your Supabase dashboard.
                </p>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  className={`w-full rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                  {...register('username')}
                  disabled={saving}
                  suppressHydrationWarning
                />
                {available.available !== null && (
                  <span className={`absolute right-3 top-2.5 sm:top-3 text-xs px-2 py-1 rounded-full ${
                    available.available ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {available.available ? 'Available' : 'Taken'}
                  </span>
                )}
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                id="bio"
                rows={3}
                className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent resize-none transition-all duration-200 text-sm sm:text-base"
                placeholder="Tell us about yourself..."
                {...register('bio')}
                disabled={saving}
                suppressHydrationWarning
              />
              {errors.bio && (
                <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
              )}
            </div>

            {/* Profile Picture */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  disabled={saving}
                  className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 transition-all duration-200 text-sm sm:text-base file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#6C63FF] file:text-white hover:file:bg-[#5A52E5]"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base font-medium"
                disabled={saving}
                onClick={() => router.push('/dashboard')}
                suppressHydrationWarning
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className={`flex-1 rounded-2xl py-2.5 sm:py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base ${
                  canSubmit 
                    ? 'bg-[#6C63FF] hover:bg-[#5A52E5] text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                suppressHydrationWarning
              >
                {saving ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && avatarPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-xl h-[360px] bg-black rounded-lg overflow-hidden">
            <Cropper
              image={avatarPreview}
              aspect={1}
              crop={crop}
              zoom={zoom}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area: any, areaPixels: { x: number; y: number; width: number; height: number }) => setCroppedAreaPixels(areaPixels)}
              cropShape="round"
              showGrid={false}
            />
          </div>
          <div className="flex items-center gap-4 w-full max-w-xl mt-4">
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1"
              suppressHydrationWarning
            />
            <button
              className="rounded-md border border-gray-600 px-3 py-2 text-gray-200"
              onClick={() => {
                setShowCropper(false);
                // if user cancels, keep the chosen file but no crop applied
                setCroppedAreaPixels(null);
              }}
              suppressHydrationWarning
            >Cancel</button>
            <button
              className="rounded-md bg-white text-black px-3 py-2"
              onClick={async () => {
                if (avatarPreview && croppedAreaPixels) {
                  try {
                    const blob = await getCroppedBlob(avatarPreview, croppedAreaPixels);
                    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                    setFile(croppedFile);
                    const reader = new FileReader();
                    reader.onload = () => setAvatarPreview(reader.result as string);
                    reader.readAsDataURL(croppedFile);
                    setShowCropper(false);
                  } catch (e) {
                    toast.error('Failed to crop image');
                  }
                } else {
                  setShowCropper(false);
                }
              }}
              suppressHydrationWarning
            >Apply crop</button>
          </div>
        </div>
      )}

    </div>
  );
}
