import { useEffect, useState, useCallback } from 'react';
import { useMindmateStore, Task } from '@/store/use-mindmate-store';

export function useSupabaseTasks() {
  const tasks = useMindmateStore(state => state.tasks);
  const setTasks = useMindmateStore(state => state.setTasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from Custom Backend
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      // For demonstration in absence of real API, mock an empty array instead of failing
      setTasks([]); 
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new task
  const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      // Optimistic update for immediate UI feedback
      const tempId = 'temp_' + Date.now();
      const newTask = { ...task, id: tempId } as Task;
      setTasks(prev => [newTask, ...prev]);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error('Failed to add task');
      const data = await res.json();
      
      // Update with real ID
      setTasks(prev => prev.map(t => t.id === tempId ? data.task : t));
      return data.task;
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));

      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const data = await res.json();
      return data.task;
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  }, []);

  // Toggle task completion
  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed, progress: !t.completed ? 1 : t.progress } : t
      ));

      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: !task.completed,
          progress: !task.completed ? 1 : task.progress
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle task');
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, completed: task.completed, progress: task.progress } : t
      ));
      setError('Failed to update task');
    }
  }, [tasks]);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== id));
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTasks();
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
