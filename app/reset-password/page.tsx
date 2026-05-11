'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : undefined);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectBase ? `${redirectBase}/update-password` : undefined,
      });
      if (error) throw error;
      setMessage('If an account exists for this email, a reset link has been sent.');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg p-6 bg-black text-white">
        <h1 className="text-xl font-semibold mb-1">Reset Password</h1>
        <p className="text-sm text-neutral-500 mb-4">Enter your email to receive a password reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm">Email</label>
            <input
              required
              type="email"
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              suppressHydrationWarning
            />
          </div>
          <button className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-60" disabled={loading} suppressHydrationWarning>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        {message && <p className="text-green-500 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}
