// TypeScript database model definitions

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password_hash: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  primary_goal?: string;
  available_time?: string;
  consistency_blocker?: string;
  preferred_time?: string;
  support_style?: string;
  growth_preference?: string;
  coach_tone: string;
  content_preferences: string[];
  inspiration_preferences: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  tiny_goal: string;
  frequency: string;
  preferred_time?: string;
  reminder_enabled: boolean;
  growth_mode: string;
  coach_tone: string;
  support_content_preference?: string;
  inspiration_preference?: string;
  start_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitScore {
  id: string;
  user_id: string;
  habit_name: string;
  category: string;
  score: number;
  note?: string;
  current_frequency?: string;
  desired_improvement?: string;
  difficulty_level?: string;
  emotional_feeling?: string;
  priority?: string;
  converted_to_habit: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  status: string; // 'completed', 'missed', 'paused'
  reflection?: string;
  mood?: string;
  effort_level?: string;
  created_at: string;
}

export interface HabitStats {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  completion_rate: number;
  last_completed_date?: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  user_id: string;
  habit_id?: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  habit_id?: string;
  message: string;
  message_type: string; // 'daily', 'weekly_review', 'suggestion'
  accepted: boolean;
  created_at: string;
}

export interface ContentItem {
  id: string;
  user_id?: string; // null if system default
  title: string;
  category: string;
  type: string;
  url: string;
  platform?: string;
  short_description?: string;
  tags: string[];
  estimated_duration?: string;
  mood?: string;
  is_user_added: boolean;
  is_default: boolean;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentEngagement {
  id: string;
  user_id: string;
  content_item_id: string;
  habit_id?: string;
  action: string;
  created_at: string;
}

export interface InspirationItem {
  id: string;
  user_id?: string; // null if system default
  text: string;
  author?: string;
  source?: string;
  type: string;
  category?: string;
  tone?: string;
  tags: string[];
  is_user_added: boolean;
  is_default: boolean;
  is_active: boolean;
  is_favourite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  habit_id?: string;
  reminder_type: string;
  reminder_time: string; // HH:MM
  reminder_days: number[];
  message: string;
  include_inspiration: boolean;
  include_support_link: boolean;
  is_active: boolean;
  snooze_minutes: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSecuritySettings {
  id: string;
  user_id: string;
  pin_enabled: boolean;
  pin_hash?: string;
  biometric_enabled: boolean;
  app_lock_enabled: boolean;
  lock_timeout_minutes: number;
  failed_pin_attempts: number;
  locked_until?: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserConsents {
  id: string;
  user_id: string;
  data_storage_consent: boolean;
  ai_personalization_consent: boolean;
  support_content_consent: boolean;
  habit_score_personalization_consent: boolean;
  inspiration_personalization_consent: boolean;
  consent_version: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityAuditLog {
  id: string;
  user_id?: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
