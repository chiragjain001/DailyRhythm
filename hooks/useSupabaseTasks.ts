import { useCallback } from 'react';
import { useMindmateStore, Task } from '@/store/use-mindmate-store';

/**
 * Tasks hook — operates entirely on the Zustand global store (persisted to
 * localStorage).  No API calls are made; data survives page refreshes via
 * Zustand's persist middleware.
 */
export function useSupabaseTasks() {
  const tasks = useMindmateStore(state => state.tasks);
  const setTasks = useMindmateStore(state => state.setTasks);

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, [setTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [setTasks]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id
        ? { ...t, completed: !t.completed, progress: !t.completed ? 1 : t.progress }
        : t
    ));
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [setTasks]);

  return {
    tasks,
    loading: false,
    error: null,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    refetch: () => {},
  };
}
