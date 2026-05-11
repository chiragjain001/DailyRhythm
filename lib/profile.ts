import { getCurrentUser, setAuthSession } from '@/lib/auth-utils';
import { safeStorage } from '@/lib/safeStorage';

export type ProfileRow = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
};

export async function getProfile(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const data: ProfileRow = {
      id: user.id,
      username: user.username || `user_${user.id.substring(0, 6)}`,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      avatar_url: user.avatar_url || null,
      bio: null,
      profile_completed: user.profile_completed || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: new Error(errorMessage) };
  }
}

export async function upsertProfile(values: Partial<ProfileRow> & { id: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = safeStorage.getItem('mindsync_token') || 'dummy_token';

    const updatedUser = {
      ...user,
      username: values.username || user.username,
      first_name: values.first_name || user.first_name,
      last_name: values.last_name || user.last_name,
      avatar_url: values.avatar_url || user.avatar_url,
      profile_completed: true
    };

    setAuthSession(token, updatedUser);
    
    return { data: values as ProfileRow, error: null };
  } catch (error) {
    console.error('Error upserting profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: new Error(errorMessage) };
  }
}

export function isProfileComplete(profile: Partial<ProfileRow> | null | undefined) {
  if (!profile) return false;
  return Boolean(profile.profile_completed);
}

export async function checkUsernameAvailable(username: string, currentUserId?: string) {
  // Mock availability check
  if (!username || username.length < 3) {
    return { available: false, error: 'Username must be at least 3 characters' };
  }
  return { available: true, error: null };
}

export async function uploadAvatar(file: File, userId: string) {
  try {
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
    }

    // Limit file size to 2MB
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 2MB.');
    }

    // Since we are mocking the backend, return a local blob URL
    const url = URL.createObjectURL(file);

    return { 
      data: { 
        path: 'local_avatar', 
        url: url 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to upload avatar' 
    };
  }
}

export async function deleteOldAvatar(path: string) {
  return { error: null };
}
