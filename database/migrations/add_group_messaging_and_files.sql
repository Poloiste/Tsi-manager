-- =========================================
-- Group Messaging and File Sharing - Database Migration
-- =========================================

-- ==========================================
-- PART 1: GROUP MESSAGING
-- ==========================================

-- Add a group_id column to chat_channels to link channels to study groups
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE;

-- Create index for group_id on chat_channels
CREATE INDEX IF NOT EXISTS idx_chat_channels_group_id ON public.chat_channels(group_id);

-- Update RLS policies for chat_channels to restrict access to group members
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read channels" ON public.chat_channels;

-- Allow all users to read non-group channels (general, subject channels)
CREATE POLICY "Anyone can read public channels" ON public.chat_channels
  FOR SELECT USING (group_id IS NULL);

-- Allow group members to read their group's channel
CREATE POLICY "Group members can read group channels" ON public.chat_channels
  FOR SELECT USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM public.study_group_members
      WHERE study_group_members.group_id = chat_channels.group_id
      AND study_group_members.user_id = auth.uid()
    )
  );

-- Update RLS policies for chat_messages to restrict access to group members
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;

-- Allow all users to read messages in non-group channels
CREATE POLICY "Anyone can read public messages" ON public.chat_messages
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM public.chat_channels WHERE group_id IS NULL
    )
  );

-- Allow group members to read messages in their group's channel
CREATE POLICY "Group members can read group messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.chat_channels
      INNER JOIN public.study_group_members ON chat_channels.group_id = study_group_members.group_id
      WHERE chat_channels.id = chat_messages.channel_id
      AND study_group_members.user_id = auth.uid()
    )
  );

-- Allow authenticated users to send messages to public channels
CREATE POLICY "Authenticated users can send public messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    channel_id IN (
      SELECT id FROM public.chat_channels WHERE group_id IS NULL
    )
  );

-- Allow group members to send messages to their group's channel
CREATE POLICY "Group members can send group messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM public.chat_channels
      INNER JOIN public.study_group_members ON chat_channels.group_id = study_group_members.group_id
      WHERE chat_channels.id = chat_messages.channel_id
      AND study_group_members.user_id = auth.uid()
    )
  );

-- Function to create a chat channel for a study group
CREATE OR REPLACE FUNCTION create_group_chat_channel() RETURNS TRIGGER AS $$
BEGIN
  -- Create a dedicated chat channel for the new study group
  -- Use the group ID in the name to ensure uniqueness
  INSERT INTO public.chat_channels (name, type, group_id)
  VALUES ('Group: ' || NEW.name, 'group', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create chat channel when a study group is created
DROP TRIGGER IF EXISTS create_group_chat_channel_trigger ON public.study_groups;
CREATE TRIGGER create_group_chat_channel_trigger
  AFTER INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION create_group_chat_channel();

-- ==========================================
-- PART 2: FILE SHARING
-- ==========================================

-- Create group_files table
CREATE TABLE IF NOT EXISTS public.group_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_files_group_id ON public.group_files(group_id);
CREATE INDEX IF NOT EXISTS idx_group_files_user_id ON public.group_files(user_id);
CREATE INDEX IF NOT EXISTS idx_group_files_uploaded_at ON public.group_files(uploaded_at DESC);

-- Enable RLS on group_files
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_files
-- Allow group members to view files shared in their group
CREATE POLICY "Group members can view group files" ON public.group_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.study_group_members
      WHERE study_group_members.group_id = group_files.group_id
      AND study_group_members.user_id = auth.uid()
    )
  );

-- Allow group members to share files in their group
CREATE POLICY "Group members can share files" ON public.group_files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1
      FROM public.study_group_members
      WHERE study_group_members.group_id = group_files.group_id
      AND study_group_members.user_id = auth.uid()
    )
  );

-- Allow users to delete their own shared files OR if they're admins in the group
DROP POLICY IF EXISTS "Users can delete their own files" ON public.group_files;
DROP POLICY IF EXISTS "Admins can delete group files" ON public.group_files;

CREATE POLICY "Users can delete own files or admins can delete group files" ON public.group_files
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM public.study_group_members
      WHERE study_group_members.group_id = group_files.group_id
      AND study_group_members.user_id = auth.uid() 
      AND study_group_members.role = 'admin'
    )
  );
