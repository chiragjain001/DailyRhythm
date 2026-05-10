'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { supabase, safeSupabase } from '@/lib/supabaseClient';
import type { AgendaRow } from '@/lib/types';
import {
  addAgendaTask,
  fetchAgenda,
  completeAgendaTask,
} from '@/lib/db';
import { useLoadingControl } from '@/hooks/use-route-loading';

export default function AgendaPage() {
  const { showLoading, hideLoading } = useLoadingControl();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<AgendaRow[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let mounted = true;
    async function init() {
      try {
        const { data, error } = await safeSupabase.auth.getUser();
        if (!mounted) return;
        
        if (error) {
          if (error.message.includes('Rate limit exceeded')) {
            toast.error('Too many requests. Please refresh the page in a moment.');
            return;
          }
          throw error;
        }
        
        setUser(data.user ?? null);
        if (data.user) {
          const { data: list, error } = await fetchAgenda(data.user.id);
          if (error) toast.error(error.message);
          else setTasks(list ?? []);
        }
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    init();

    const { data: sub } = supabase?.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    }) || { data: { subscription: { unsubscribe: () => {} } } };
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isClient]);

  const isLoggedIn = useMemo(() => !!user, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newTask.trim() || !isClient) return;
    try {
      showLoading('Adding task...');
      const { data, error } = await addAgendaTask(newTask.trim(), user.id);
      if (error) throw error;
      setTasks((prev) => (data ? [data as AgendaRow, ...prev] : prev));
      setNewTask('');
      hideLoading();
    } catch (e: any) {
      hideLoading();
      toast.error(e?.message ?? 'Failed to add task');
    }
  }

  async function handleComplete(id: string) {
    // Optimistic update
    const prevTasks = tasks;
    setTasks((curr) => curr.map((t) => (t.id === id ? { ...t, completed: true } : t)));
    try {
      const { error } = await completeAgendaTask(id);
      if (error) throw error;
    } catch (e: any) {
      // Revert on error
      setTasks(prevTasks);
      toast.error(e?.message ?? 'Failed to complete task');
      if (user) {
        const { data: list } = await fetchAgenda(user.id);
        setTasks(list ?? []);
      }
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await safeSupabase.auth.signOut();
      if (error) {
        if (error.message.includes('Rate limit exceeded')) {
          toast.error('Too many requests. Please try again in a moment.');
          return;
        }
        throw error;
      }
      setTasks([]);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to sign out');
    }
  }

  if (loading || !isClient) return <div className="p-6">Loading…</div>;

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <button className="text-sm underline" onClick={handleSignOut}>Sign out</button>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Add a task…"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4">Add</button>
      </form>



      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between border rounded-md px-3 py-2">
            <div>
              <p className={t.completed ? 'line-through opacity-60' : ''}>{t.task}</p>
              <p className="text-xs text-neutral-500">{new Date(t.created_at).toLocaleString()}</p>
            </div>
            {!t.completed && (
              <button onClick={() => handleComplete(t.id)} className="text-sm underline">
                Mark complete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
