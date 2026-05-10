export interface AgendaRow {
  id: string;
  user_id: string;
  task: string;
  completed: boolean;
  created_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  habit: string;
  completed: boolean;
  created_at: string;
}

export interface WellnessRow {
  id: string;
  user_id: string;
  activity: string;
  completed: boolean;
  created_at: string;
}
