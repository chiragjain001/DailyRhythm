'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type { HabitRow } from '@/lib/types';
import { addHabit, fetchHabits, completeHabit } from '@/lib/db';

export default function HabitsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [newHabit, setNewHabit] = useState('');
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
          const { data: list, error } = await fetchHabits(data.user.id);
          if (error) setError(error.message);
          else setHabits(list ?? []);
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
    if (!user || !newHabit.trim()) return;
    try {
      const { data, error } = await addHabit(newHabit.trim(), user.id);
      if (error) throw error;
      if (data) setHabits((prev) => [data as HabitRow, ...prev]);
      setNewHabit('');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add habit');
    }
  }

  async function handleComplete(id: string) {
    const prev = habits;
    setHabits((curr) => curr.map((h) => (h.id === id ? { ...h, completed: true } : h)));
    try {
      const { error } = await completeHabit(id);
      if (error) throw error;
    } catch (e: any) {
      setHabits(prev);
      setError(e?.message ?? 'Failed to complete habit');
      if (user) {
        const { data: list } = await fetchHabits(user.id);
        setHabits(list ?? []);
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
      <h1 className="text-2xl font-semibold">Habits</h1>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Add a habit…"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
        />
        <button className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4">Add</button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <ul className="space-y-2">
        {habits.map((h) => (
          <li key={h.id} className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <p className={h.completed ? 'line-through opacity-60' : ''}>{h.habit}</p>
              <p className="text-xs text-neutral-500">{new Date(h.created_at).toLocaleString()}</p>
            </div>
            {!h.completed && (
              <button onClick={() => handleComplete(h.id)} className="text-sm underline">
                Mark complete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
