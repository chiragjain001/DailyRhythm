'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type { WellnessRow } from '@/lib/types';
import { addWellnessActivity, fetchWellnessChecklist, completeWellnessActivity } from '@/lib/db';

export default function WellnessPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<WellnessRow[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data.user ?? null);
        if (data.user) {
          const { data: list, error } = await fetchWellnessChecklist(data.user.id);
          if (error) setError(error.message);
          else setItems(list ?? []);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = useMemo(() => !!user, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newItem.trim()) return;
    try {
      const { data, error } = await addWellnessActivity(newItem.trim(), user.id);
      if (error) throw error;
      if (data) setItems((prev) => [data as WellnessRow, ...prev]);
      setNewItem('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add activity');
    }
  }

  async function handleComplete(id: string) {
    const prev = items;
    setItems((curr) => curr.map((it) => (it.id === id ? { ...it, completed: true } : it)));
    try {
      const { error } = await completeWellnessActivity(id);
      if (error) throw error;
    } catch (e: any) {
      setItems(prev);
      setError(e?.message ?? 'Failed to complete activity');
      if (user) {
        const { data: list } = await fetchWellnessChecklist(user.id);
        setItems(list ?? []);
      }
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;

  if (!isLoggedIn) {
    return (
      <div className="p-6">
        <p className="mb-2">You are not signed in.</p>
        <Link className="underline" href="/auth">Go to Auth</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Wellness Checklist</h1>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Add an activity…"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4">Add</button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <p className={it.completed ? 'line-through opacity-60' : ''}>{it.activity}</p>
              <p className="text-xs text-neutral-500">{new Date(it.created_at).toLocaleString()}</p>
            </div>
            {!it.completed && (
              <button onClick={() => handleComplete(it.id)} className="text-sm underline">
                Mark complete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
