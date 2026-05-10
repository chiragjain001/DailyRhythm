import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/store/use-mindmate-store';
import { useRouter } from 'next/navigation';

interface SupabaseTask {
  id: string;
  user_id: string;
  title: string;
  assignee?: string;
  time?: string;
  priority: 'important' | 'today' | 'habit';
  progress: number;
  completed: boolean;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mappedTasks: Task[] = (data || []).map((task: SupabaseTask) => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee,
        time: task.time,
        priority: task.priority,
        progress: task.progress,
        completed: task.completed,
        category: task.category || 'general',
        tags: task.tags || [],
        createdAt: task.created_at,
      }));

      setTasks(mappedTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Add a new task
  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: task.title,
          assignee: task.assignee,
          time: task.time,
          priority: task.priority,
          progress: task.progress || 0,
          completed: task.completed || false
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTask: Task = {
        id: data.id,
        title: data.title,
        assignee: data.assignee,
        time: data.time,
        priority: data.priority,
        progress: data.progress,
        completed: data.completed
      };

      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));

      return data;
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  }, []);

  // Toggle task completion with optimistic updates for better mobile experience
  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistic update for immediate UI feedback
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed, progress: !t.completed ? 1 : t.progress } : t
    ));

    try {
      await updateTask(id, {
        completed: !task.completed,
        progress: !task.completed ? 1 : task.progress
      });
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, completed: task.completed, progress: task.progress } : t
      ));
      setError('Failed to update task');
    }
  }, [tasks, updateTask]);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    let channel: any;
    
    const setupRealtimeSubscription = async () => {
      await fetchTasks();
      
      // Get current user for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to real-time changes with user filtering
      channel = supabase
        .channel('tasks_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔄 Real-time task change detected:', payload);
          fetchTasks();
        })
        .subscribe();
    };
    
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    refetch: fetchTasks
  };
}
