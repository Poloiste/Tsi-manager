-- Migration: Add notification and reminder tables
-- Description: Creates tables for user notification settings and scheduled reminders

-- Table: user_notification_settings
-- Stores notification preferences for each user
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_notifications_enabled BOOLEAN DEFAULT false,
  daily_reminder_enabled BOOLEAN DEFAULT true,
  daily_reminder_time TIME DEFAULT '19:00',
  due_cards_reminder_enabled BOOLEAN DEFAULT true,
  streak_warning_enabled BOOLEAN DEFAULT true,
  upcoming_test_reminder_enabled BOOLEAN DEFAULT true,
  upcoming_test_days_before INTEGER DEFAULT 3,
  daily_goal_cards INTEGER DEFAULT 20,
  goal_achieved_notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table: scheduled_reminders
-- Stores scheduled reminders for users
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'daily_review', 'due_cards', 'streak_warning', 'upcoming_test', 'goal_achieved'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional data like test_id, course_id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_user_scheduled_reminders (user_id, scheduled_for),
  INDEX idx_user_pending_reminders (user_id, delivered_at, dismissed_at)
);

-- Enable Row Level Security
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON user_notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON user_notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON user_notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_reminders
CREATE POLICY "Users can view their own reminders"
  ON scheduled_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON scheduled_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON scheduled_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON scheduled_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
