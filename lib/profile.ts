import { supabase } from '@/lib/supabaseClient';

export type ProfileRow = {
  id: string; // references auth.users(id)
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

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication failed');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: new Error(errorMessage) };
  }
}

export async function upsertProfile(values: Partial<ProfileRow> & { id: string }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...values,
        updated_at: new Date().toISOString(),
        profile_completed: true // Mark as complete when updated
      })
      .select()
      .single<ProfileRow>();
    
    if (error) {
      console.error('Supabase upsert error:', error);
      
      // If table doesn't exist, provide a helpful error message
      if (error.message && error.message.includes('relation "public.profiles" does not exist')) {
        throw new Error('Database setup required. Please run the SQL setup script in your Supabase dashboard.');
      }
      
      throw new Error(`Database error: ${error.message || 'Unknown error'}`);
    }
    
    return { data, error: null };
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
  try {
    // Basic validation
    if (!username || username.length < 3) {
      return { available: false, error: 'Username must be at least 3 characters' };
    }

    // Check if user is authenticated first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { available: false, error: 'Authentication required' };
    }

    // Use the current user's ID if not provided
    const userId = currentUserId || user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      // If table doesn't exist, assume username is available for now
      if (error.message && error.message.includes('relation "public.profiles" does not exist')) {
        return { available: true, error: null };
      }
      throw error;
    }

    // If no profile found with this username, it's available
    if (!data) {
      return { available: true, error: null };
    }

    // If the profile belongs to the current user, it's available for them
    if (data.id === userId) {
      return { available: true, error: null };
    }

    // Username is taken by someone else
    return { available: false, error: null };
  } catch (error) {
    console.error('Error checking username availability:', error);
    
    // If it's a table not found error, return available for now
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('relation "public.profiles" does not exist') || 
        errorMessage.includes('table') || 
        errorMessage.includes('schema')) {
      return { available: true, error: 'Database setup required - username will be validated after setup' };
    }
    
    return { available: false, error: 'Unable to check username availability' };
  }
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

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${userId}/${Date.now()}.${ext}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { 
      data: { 
        path: fileName, 
        url: publicUrl 
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

// Helper function to delete old avatar when updating
export async function deleteOldAvatar(path: string) {
  try {
    if (!path) return { error: null };
    
    // Extract the path after 'avatars/'
    const pathParts = path.split('avatars/');
    if (pathParts.length < 2) return { error: 'Invalid avatar path' };
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([pathParts[1]]);
      
    return { error };
  } catch (error) {
    console.error('Error deleting old avatar:', error);
    return { error };
  }
}
