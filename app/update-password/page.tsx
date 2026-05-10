'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Page is opened by magic link from email
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');
      if (password !== confirm) throw new Error('Passwords do not match.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated. You can now log in.');
      router.replace('/auth');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg p-6 bg-black text-white">
        <h1 className="text-xl font-semibold mb-1">Set a new password</h1>
        <p className="text-sm text-neutral-500 mb-4">Enter and confirm your new password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm">New Password</label>
            <input
              required
              type="password"
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              suppressHydrationWarning
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm">Confirm Password</label>
            <input
              required
              type="password"
              className="w-full rounded-md border px-3 py-2 bg-background"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              suppressHydrationWarning
            />
          </div>
          <button className="w-full rounded-md bg-white text-black py-2 font-medium disabled:opacity-60" disabled={loading} suppressHydrationWarning>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
        {message && <p className="text-green-500 text-sm mt-3">{message}</p>}
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}
