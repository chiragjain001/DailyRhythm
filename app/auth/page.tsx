'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, safeSupabase } from '@/lib/supabaseClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import zxcvbn from 'zxcvbn';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().max(50, 'Max 50 characters').optional().or(z.literal('')),
  lastName: z.string().max(50, 'Max 50 characters').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

// Auth component without SSR
function AuthPageContent({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    getValues,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' });

  const passwordValue = watch('password');
  const passwordScore = useMemo(() => {
    if (!passwordValue) return null;
    try {
      return zxcvbn(passwordValue).score; // 0-4
    } catch {
      return null;
    }
  }, [passwordValue]);

  useEffect(() => {
    // Set client flag after component mounts
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await safeSupabase.auth.getSession();
        if (error) {
          if (error.message.includes('Rate limit exceeded')) {
            console.warn('Rate limit hit during session check');
            return;
          }
          throw error;
        }
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('profile_completed')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.profile_completed) {
            router.replace('/dashboard');
          } else {
            router.replace('/setup-profile');
          }
        }
      } catch (err: any) {
        console.error('Auth check failed:', err);
        setError('Failed to check authentication status');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('profile_completed')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.profile_completed) {
            router.replace('/dashboard');
          } else {
            router.replace('/setup-profile');
          }
        } catch (err: any) {
          console.error('Profile check failed:', err);
          router.replace('/setup-profile');
        }
      } else if (event === 'SIGNED_OUT') {
        router.replace('/auth');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, isClient]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await safeSupabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { first_name: values.firstName || null, last_name: values.lastName || null },
          },
        });
        if (error) {
          if (error.message.includes('Rate limit exceeded')) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          }
          throw error;
        }
        setMessage('Signup successful. If email confirmations are enabled, check your inbox.');
        const { data: userData } = await safeSupabase.auth.getUser();
        const user = userData.user;
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            first_name: values.firstName || null,
            last_name: values.lastName || null,
          });
        }
      } else {
        const { error } = await safeSupabase.auth.signInWithPassword({ 
          email: values.email, 
          password: values.password 
        });
        if (error) {
          if (error.message.includes('Rate limit exceeded')) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          }
          throw error;
        }
      }
      router.replace('/setup-profile');
      toast.success(mode === 'signup' ? 'Signed up' : 'Signed in');
    } catch (err: any) {
      const msg = err.message ?? 'Unexpected error';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  });

  async function signInWithGoogle() {
    // Guard against server-side execution
    if (!isClient) return;
    
    setLoading(true);
    setError(null);
    try {
      // Use environment variable or construct URL on client side only
      const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || `${window.location.protocol}//${window.location.host}`;
      const { error } = await safeSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectBase}/auth/callback?next=/setup-profile`,
        },
      });
      if (error) {
        if (error.message.includes('Rate limit exceeded')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw error;
      }
    } catch (err: any) {
      const msg = err.message ?? 'Failed to sign in with Google';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Show loading skeleton until client is ready to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-2">
        {/* Mobile Header - Only visible on mobile */}
        <div className="lg:hidden relative flex items-center justify-center py-12 px-6 text-gray-800 min-h-[200px]" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
          <div className="absolute inset-0"></div>
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="logo">
              <div className="logo-icon">🧠</div>
              <span className="logo-text">MindSync</span>
            </div>
            <p className="text-black/70 mt-3 max-w-sm">Transform your daily routine - achieve more, stay mindful, and track progress with MindSync</p>
          </div>
        </div>
        
        {/* Loading content */}
        <div className="flex-1 flex items-start justify-center pt-8 pb-4 px-4 sm:items-center sm:p-6 md:p-8 lg:p-12 xl:p-20 min-h-[calc(100vh-200px)] lg:min-h-auto" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
          <div className="w-full max-w-sm sm:max-w-md rounded-2xl p-6 sm:p-8 text-gray-800 animate-pulse" style={{background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'}}>
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-2xl"></div>
              <div className="h-12 bg-gray-200 rounded-2xl"></div>
              <div className="h-12 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-2">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden relative flex items-center justify-center py-12 px-6 text-gray-800 min-h-[200px]" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
        <div className="absolute inset-0"></div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">MindSync</span>
          </div>
          <p className="text-black/70 mt-3 max-w-sm">Transform your daily routine - achieve more, stay mindful, and track progress with MindSync</p>
        </div>
      </div>

      {/* Desktop Left Panel - Hidden on mobile */}
      <div className="relative hidden lg:flex items-center justify-center p-6 xl:p-10 text-gray-800 overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage: 'url(/mind.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'blur(4px)', transform: 'scale(1.1)'}}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-black/30"></div>
        <div className="max-w-md space-y-6 relative z-10 ">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">MindSync</span>
         </div>
         <p className="text-white/70">Transform your daily routine - achieve more, stay mindful, and track progress with MindSync</p>
          <div className='mt-40'>
            <h2 className="text-2xl xl:text-3xl font-bold mb-2">Get Started with Us</h2>
            <p className="text-white-700">Complete these easy steps to register your account.</p>
          </div>
          <div className="space-y-4 mt-8">
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">1</span>
                <div>
                  <p className="font-medium">Sign up your account</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 opacity-60">
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

      <div className="flex-1 flex items-start justify-center pt-8 pb-4 px-4 sm:items-center sm:p-6 md:p-8 lg:p-12 xl:p-20 min-h-[calc(100vh-200px)] lg:min-h-auto" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
        <div className="w-full max-w-sm sm:max-w-md rounded-2xl p-6 sm:p-8 text-gray-800 animate-fade-in" style={{background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'}}>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">{mode === 'signup' ? 'Sign Up Account' : 'Sign In'}</h1>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6">Enter your personal data to {mode === 'signup' ? 'create your account' : 'log in'}.</p>

          <div className="flex gap-2">
            <button
              onClick={signInWithGoogle}
              className="flex-1 rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:border-[#6C63FF] hover:bg-gray-50 transition-all duration-200 text-gray-700"
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.2 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29 35.8 26.6 37 24 37c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.2 39.5 16.1 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.4 5.6-6.1 7.2l6.2 5.2C37.9 38.7 40 33.8 40 28c0-2.6-.5-4.9-1.4-7.5z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="my-4 sm:my-6 flex items-center gap-3">
            <div className="h-px bg-gray-300 flex-1" />
            <span className="text-xs text-gray-500">Or</span>
            <div className="h-px bg-gray-300 flex-1" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    {...register('firstName')}
                    placeholder="eg. John"
                                      />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                    {...register('lastName')}
                    placeholder="eg. Francisco"
                                      />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                required
                type="email"
                className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                {...register('email')}
                placeholder="eg. johnfrancis@gmail.com"
                              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent pr-10 sm:pr-12 transition-all duration-200 text-sm sm:text-base"
                  {...register('password')}
                  placeholder="Enter your password"
                                  />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-xs text-[#6C63FF] hover:text-[#5A52E5] font-medium"
                                  >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
              {passwordScore !== null && (
                <div className="text-xs mt-1">
                  <span
                    className={
                      passwordScore >= 3
                        ? 'text-green-500'
                        : passwordScore === 2
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }
                  >
                    {passwordScore >= 3 ? 'Strong' : passwordScore === 2 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#6C63FF] hover:bg-[#5A52E5] text-white py-2.5 sm:py-3 font-semibold disabled:opacity-60 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              disabled={loading}
                          >
              {loading ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="text-xs sm:text-sm mt-3 sm:mt-4 text-center space-y-2">
            {mode === 'signup' ? (
              <button className="text-[#6C63FF] hover:text-[#5A52E5] font-medium" onClick={() => setMode('signin')} >Already have an account? Log in</button>
            ) : (
              <button className="text-[#6C63FF] hover:text-[#5A52E5] font-medium" onClick={() => setMode('signup')} >No account? Sign up</button>
            )}
            <div className="mt-2">
              {!mode || mode === 'signin' ? (
                <a className="text-[#6C63FF] hover:text-[#5A52E5] font-medium" href="/reset-password">Forgot password?</a>
              ) : null}
            </div>
          </div>

          {message && <p className="text-green-600 text-sm mt-3">{message}</p>}
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage({ params, searchParams }: { params: Promise<any>, searchParams: Promise<any> }) {
  return <AuthPageContent params={params} searchParams={searchParams} />;
}
