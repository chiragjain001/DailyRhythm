import { supabase } from './supabaseClient';
import type { AgendaRow, HabitRow, WellnessRow } from './types';

// Agenda
export async function addAgendaTask(task: string, userId: string) {
  return supabase.from('agenda').insert({ task, user_id: userId }).select().single();
}

export async function fetchAgenda(userId: string) {
  return supabase
    .from('agenda')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function completeAgendaTask(taskId: string) {
  return supabase
    .from('agenda')
    .update({ completed: true })
    .eq('id', taskId)
    .select()
    .single();
}

// Habits
export async function addHabit(habit: string, userId: string) {
  return supabase.from('habits').insert({ habit, user_id: userId }).select().single();
}

export async function fetchHabits(userId: string) {
  return supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function completeHabit(habitId: string) {
  return supabase
    .from('habits')
    .update({ completed: true })
    .eq('id', habitId)
    .select()
    .single();
}

// Wellness Checklist
export async function addWellnessActivity(activity: string, userId: string) {
  return supabase.from('wellness_checklist').insert({ activity, user_id: userId }).select().single();
}

export async function fetchWellnessChecklist(userId: string) {
  return supabase
    .from('wellness_checklist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function completeWellnessActivity(activityId: string) {
  return supabase
    .from('wellness_checklist')
    .update({ completed: true })
    .eq('id', activityId)
    .select()
    .single();
}
