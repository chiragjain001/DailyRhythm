'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { setAuthSession } from '@/lib/auth-utils';
import { supabase } from '@/lib/supabaseClient';
import { Logo } from '@/components/logo';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signupSchema = loginSchema.extend({
  firstName: z.string().max(50, 'Max 50 characters').optional().or(z.literal('')),
  lastName: z.string().max(50, 'Max 50 characters').optional().or(z.literal('')),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type FormValues = SignupValues;

function AuthPageContent() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordScore, setPasswordScore] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(signupSchema), mode: 'onChange' });

  const passwordValue = watch('password');

  // Password strength meter
  useEffect(() => {
    if (!passwordValue) { setPasswordScore(null); return; }
    let isMounted = true;
    const checkScore = async () => {
      try {
        const { default: zxcvbn } = await import('zxcvbn');
        if (isMounted) setPasswordScore(zxcvbn(passwordValue).score);
      } catch { if (isMounted) setPasswordScore(null); }
    };
    checkScore();
    return () => { isMounted = false; };
  }, [passwordValue]);

  // If user already has a session, redirect them away from the auth page
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check profile completion
          const { data: profile } = await supabase
            .from('profiles')
            .select('profile_completed')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.profile_completed) {
            router.replace('/dashboard');
          } else {
            router.replace('/setup-profile');
          }
          return; // Prevent setting isVerifyingSession to false, keep loader until redirect
        }
      } catch (err) {
        // Supabase not configured — ignore silently
      }
      setIsVerifyingSession(false);
    };
    checkAuth();
  }, [router]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        // ─── SIGN UP ───────────────────────────────────────────────────────────
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              first_name: values.firstName || '',
              last_name: values.lastName || '',
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session && data.user) {
          // User confirmed immediately (email confirmation disabled)
          setAuthSession(data.session.access_token, {
            id: data.user.id,
            email: data.user.email ?? undefined,
            first_name: values.firstName || undefined,
            last_name: values.lastName || undefined,
            profile_completed: false,
          });
          toast.success('Account created! Set up your profile.');
          router.replace('/setup-profile');
        } else {
          // Email confirmation required
          setMessage('Check your email to confirm your account, then sign in.');
          toast.success('Confirmation email sent!');
        }

      } else {
        // ─── SIGN IN ───────────────────────────────────────────────────────────
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (signInError) throw signInError;

        if (!data.session || !data.user) {
          throw new Error('Sign in failed — no session returned.');
        }

        // Check if profile is already completed
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_completed, username, avatar_url')
          .eq('id', data.user.id)
          .maybeSingle();

        const isComplete = profile?.profile_completed === true;

        // Store the session in our custom auth layer
        setAuthSession(data.session.access_token, {
          id: data.user.id,
          email: data.user.email ?? undefined,
          first_name: data.user.user_metadata?.first_name ?? undefined,
          last_name: data.user.user_metadata?.last_name ?? undefined,
          username: profile?.username ?? undefined,
          avatar_url: profile?.avatar_url ?? undefined,
          profile_completed: isComplete,
        });

        toast.success('Signed in successfully!');

        // Correct routing: existing users go to dashboard, new users to profile setup
        if (isComplete) {
          router.replace('/dashboard');
        } else {
          router.replace('/setup-profile');
        }
      }

    } catch (err: any) {
      const msg = err.message ?? 'Unexpected error';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  });

  async function signInWithGoogle() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message ?? 'Google sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-2">
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden relative flex items-center justify-center py-12 px-6 text-gray-800 min-h-[200px]" style={{background: 'linear-gradient(90deg, #fdf6ec 0%, #f4f1fe 100%)'}}>
        <div className="absolute inset-0"></div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <Logo size="lg" className="mb-2" />
          <p className="text-black/70 mt-3 max-w-sm">Transform your daily routine - achieve more, stay mindful, and track progress with DailyRythm</p>
        </div>
      </div>

      {/* Desktop Left Panel - Hidden on mobile */}
      <div className="relative hidden lg:flex items-center justify-center p-6 xl:p-10 text-gray-800 overflow-hidden">
        <div className="absolute inset-0" style={{backgroundImage: 'url(/mind.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: 'blur(4px)', transform: 'scale(1.1)'}}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-black/30"></div>
        <div className="max-w-md space-y-6 relative z-10 ">
          <Logo size="xl" className="mb-2" />
         <p className="text-white/80 font-medium">Transform your daily routine - achieve more, stay mindful, and track progress with DailyRythm</p>
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
        {isVerifyingSession ? (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center justify-center p-10 animate-pulse">
            <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">Verifying session...</p>
          </div>
        ) : (
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
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      {...register('firstName')}
                      placeholder="eg. John"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      {...register('lastName')}
                      placeholder="eg. Francisco"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  required
                  type="email"
                  className="w-full rounded-2xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  {...register('email')}
                  placeholder="eg. johnfrancis@gmail.com"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
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
                    <span className={passwordScore >= 3 ? 'text-green-500' : passwordScore === 2 ? 'text-yellow-500' : 'text-red-500'}>
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
                <button className="text-[#6C63FF] hover:text-[#5A52E5] font-medium" onClick={() => setMode('signin')}>Already have an account? Log in</button>
              ) : (
                <button className="text-[#6C63FF] hover:text-[#5A52E5] font-medium" onClick={() => setMode('signup')}>No account? Sign up</button>
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
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return <AuthPageContent />;
}
