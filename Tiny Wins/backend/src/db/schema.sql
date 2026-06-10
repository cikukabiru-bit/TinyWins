-- TinyWins Database Schema
-- Optimized for PostgreSQL and Supabase-compatible deployment

-- Enable UUID extension if not present (helpful for old postgres versions, gen_random_uuid() is native in PG 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  primary_goal VARCHAR(255),
  available_time VARCHAR(50),
  consistency_blocker VARCHAR(255),
  preferred_time VARCHAR(50),
  support_style VARCHAR(255),
  growth_preference VARCHAR(255),
  coach_tone VARCHAR(50) DEFAULT 'Gentle',
  content_preferences TEXT[] DEFAULT '{}',
  inspiration_preferences TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HABITS TABLE
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tiny_goal TEXT NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- e.g., 'daily', 'weekdays', 'weekends', 'custom'
  preferred_time VARCHAR(50),
  reminder_enabled BOOLEAN DEFAULT FALSE,
  growth_mode VARCHAR(50) DEFAULT 'Keep tiny', -- 'Keep tiny', 'Increase slowly', 'Let Tiny Coach suggest'
  coach_tone VARCHAR(50) DEFAULT 'Gentle',
  support_content_preference VARCHAR(255),
  inspiration_preference VARCHAR(255),
  start_date DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HABIT SCORES TABLE (Assessment tool)
CREATE TABLE IF NOT EXISTS habit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  score INT CHECK (score >= 1 AND score <= 10),
  note TEXT,
  current_frequency VARCHAR(100),
  desired_improvement VARCHAR(255),
  difficulty_level VARCHAR(50), -- 'easy', 'moderate', 'difficult'
  emotional_feeling VARCHAR(50), -- 'proud', 'frustrated', 'neutral', 'hopeful', 'overwhelmed'
  priority VARCHAR(50), -- 'low', 'medium', 'high'
  converted_to_habit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HABIT LOGS TABLE
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'completed', 'missed', 'paused'
  reflection TEXT,
  mood VARCHAR(50), -- 'calm', 'happy', 'tired', 'hopeful', 'overwhelmed', 'neutral'
  effort_level VARCHAR(50), -- 'easy', 'okay', 'hard'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(habit_id, log_date)
);

-- HABIT STATS TABLE (Maintains streak states)
CREATE TABLE IF NOT EXISTS habit_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL UNIQUE REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0.00,
  last_completed_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL, -- 'completed', 'missed', 'restarted', 'edited', 'reflection_added', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- COACH MESSAGES TABLE
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly_review', 'suggestion'
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CONTENT ITEMS TABLE (Support links directory)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if global default
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'video', 'playlist', 'song', 'article', 'podcast', 'breathing'
  url TEXT NOT NULL,
  platform VARCHAR(100), -- 'YouTube', 'Spotify', 'Apple Podcasts', 'Website', etc.
  short_description TEXT,
  tags TEXT[] DEFAULT '{}',
  estimated_duration VARCHAR(50), -- e.g. '5m', '15m'
  mood VARCHAR(50),
  is_user_added BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  is_favourite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CONTENT ENGAGEMENT TABLE
CREATE TABLE IF NOT EXISTS content_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'clicked', 'favourited', 'shared'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INSPIRATION ITEMS TABLE (Quotes / Verses / Prompts)
CREATE TABLE IF NOT EXISTS inspiration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if global default
  text TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'App Original',
  source VARCHAR(255),
  type VARCHAR(100) NOT NULL, -- 'quote', 'reflection', 'verse', 'saint_quote', 'prompt'
  category VARCHAR(100),
  tone VARCHAR(50) DEFAULT 'Calm',
  tags TEXT[] DEFAULT '{}',
  is_user_added BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_favourite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- REMINDERS TABLE
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  reminder_type VARCHAR(100) NOT NULL, -- 'daily', 'specific_time', 'weekly', 'nudge'
  reminder_time TIME NOT NULL,
  reminder_days INT[] DEFAULT '{1,2,3,4,5,6,0}', -- 0 is Sunday, 1 is Monday, etc.
  message TEXT NOT NULL,
  include_inspiration BOOLEAN DEFAULT FALSE,
  include_support_link BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  snooze_minutes INT DEFAULT 0,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USER SECURITY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  pin_enabled BOOLEAN DEFAULT FALSE,
  pin_hash VARCHAR(255),
  biometric_enabled BOOLEAN DEFAULT FALSE,
  app_lock_enabled BOOLEAN DEFAULT FALSE,
  lock_timeout_minutes INT DEFAULT 5, -- timeout options: 0 (immediate), 1, 5, 15, 30
  failed_pin_attempts INT DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USER CONSENTS TABLE
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  data_storage_consent BOOLEAN DEFAULT TRUE,
  ai_personalization_consent BOOLEAN DEFAULT FALSE,
  support_content_consent BOOLEAN DEFAULT FALSE,
  habit_score_personalization_consent BOOLEAN DEFAULT FALSE,
  inspiration_personalization_consent BOOLEAN DEFAULT FALSE,
  consent_version VARCHAR(50) DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL, -- 'login', 'logout', 'failed_pin_attempt', 'account_locked', 'data_export'
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security Rules (for postgres compatibility/Supabase setups)
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (User can only access rows matching their user_id)
CREATE POLICY user_profile_policy ON profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_habits_policy ON habits FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_scores_policy ON habit_scores FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_logs_policy ON habit_logs FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_stats_policy ON habit_stats FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_events_policy ON timeline_events FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_coach_policy ON coach_messages FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_engagement_policy ON content_engagement FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_reminders_policy ON reminders FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_security_policy ON user_security_settings FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_consent_policy ON user_consents FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_audit_policy ON security_audit_logs FOR ALL USING (user_id = auth.uid());

-- Index optimizations for common search patterns
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id_date ON habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_user_date ON timeline_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_inspiration_default ON inspiration_items(is_default);
CREATE INDEX IF NOT EXISTS idx_content_default ON content_items(is_default);
