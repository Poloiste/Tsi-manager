-- =========================================
-- Category and Channel System - Database Migration
-- Discord-like hierarchy: Categories contain Text and Voice channels
-- =========================================

-- ==========================================
-- PART 1: UPDATE CHAT_CHANNELS TABLE
-- ==========================================

-- Add new columns to support hierarchical structure
ALTER TABLE public.chat_channels 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'text' CHECK (channel_type IN ('category', 'text', 'voice')),
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_channels_parent_id ON public.chat_channels(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_channel_type ON public.chat_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_visibility ON public.chat_channels(visibility);
CREATE INDEX IF NOT EXISTS idx_chat_channels_position ON public.chat_channels(position);

-- ==========================================
-- PART 2: CREATE CHANNEL_MEMBERSHIPS TABLE
-- ==========================================

-- Table to manage user roles in channels (owner, moderator, member)
CREATE TABLE IF NOT EXISTS public.channel_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_memberships_channel_id ON public.channel_memberships(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_memberships_user_id ON public.channel_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_memberships_role ON public.channel_memberships(role);

-- Enable RLS on channel_memberships
ALTER TABLE public.channel_memberships ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 3: UPDATE RLS POLICIES FOR CHAT_CHANNELS
-- ==========================================

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Anyone can read public channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Group members can read group channels" ON public.chat_channels;

-- Allow users to read public channels (not linked to groups)
CREATE POLICY "Public channels are viewable by everyone" ON public.chat_channels
  FOR SELECT USING (
    visibility = 'public' AND group_id IS NULL
  );

-- Allow users to read private channels they are members of
CREATE POLICY "Private channel members can view their channels" ON public.chat_channels
  FOR SELECT USING (
    visibility = 'private' AND group_id IS NULL AND
    EXISTS (
      SELECT 1
      FROM public.channel_memberships
      WHERE channel_memberships.channel_id = chat_channels.id
      AND channel_memberships.user_id = auth.uid()
    )
  );

-- Preserve existing group channel access
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

-- Allow authenticated users to create categories and channels
CREATE POLICY "Authenticated users can create channels" ON public.chat_channels
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = created_by
  );

-- Allow channel owners and moderators to update channels
CREATE POLICY "Channel owners and moderators can update channels" ON public.chat_channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.channel_memberships
      WHERE channel_memberships.channel_id = chat_channels.id
      AND channel_memberships.user_id = auth.uid()
      AND channel_memberships.role IN ('owner', 'moderator')
    ) OR auth.uid() = created_by
  );

-- Allow channel owners to delete channels
CREATE POLICY "Channel owners can delete channels" ON public.chat_channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.channel_memberships
      WHERE channel_memberships.channel_id = chat_channels.id
      AND channel_memberships.user_id = auth.uid()
      AND channel_memberships.role = 'owner'
    ) OR auth.uid() = created_by
  );

-- ==========================================
-- PART 4: UPDATE RLS POLICIES FOR CHAT_MESSAGES
-- ==========================================

-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Anyone can read public messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Group members can read group messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send public messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Group members can send group messages" ON public.chat_messages;

-- Allow all users to read messages in public channels
CREATE POLICY "Users can read public channel messages" ON public.chat_messages
  FOR SELECT USING (
    channel_id IN (
      SELECT id FROM public.chat_channels 
      WHERE visibility = 'public' AND group_id IS NULL
    )
  );

-- Allow members to read messages in private channels
CREATE POLICY "Members can read private channel messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.chat_channels
      INNER JOIN public.channel_memberships ON chat_channels.id = channel_memberships.channel_id
      WHERE chat_channels.id = chat_messages.channel_id
      AND chat_channels.visibility = 'private'
      AND chat_channels.group_id IS NULL
      AND channel_memberships.user_id = auth.uid()
    )
  );

-- Preserve group message access
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
CREATE POLICY "Users can send messages to public channels" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    channel_id IN (
      SELECT id FROM public.chat_channels 
      WHERE visibility = 'public' AND group_id IS NULL
    )
  );

-- Allow members to send messages to private channels
CREATE POLICY "Members can send messages to private channels" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1
      FROM public.chat_channels
      INNER JOIN public.channel_memberships ON chat_channels.id = channel_memberships.channel_id
      WHERE chat_channels.id = chat_messages.channel_id
      AND chat_channels.visibility = 'private'
      AND chat_channels.group_id IS NULL
      AND channel_memberships.user_id = auth.uid()
    )
  );

-- Preserve group message sending
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

-- ==========================================
-- PART 5: RLS POLICIES FOR CHANNEL_MEMBERSHIPS
-- ==========================================

-- Allow users to view memberships of channels they belong to
CREATE POLICY "Channel members can view channel memberships" ON public.channel_memberships
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM public.channel_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Allow channel owners and moderators to add members
CREATE POLICY "Channel owners and moderators can add members" ON public.channel_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.channel_memberships
      WHERE channel_memberships.channel_id = channel_id
      AND channel_memberships.user_id = auth.uid()
      AND channel_memberships.role IN ('owner', 'moderator')
    )
  );

-- Allow channel owners and moderators to update member roles
CREATE POLICY "Channel owners and moderators can update member roles" ON public.channel_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.channel_memberships cm
      WHERE cm.channel_id = channel_memberships.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
    )
  );

-- Allow users to leave channels and owners/moderators to remove members
CREATE POLICY "Members can leave and owners can remove members" ON public.channel_memberships
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM public.channel_memberships cm
      WHERE cm.channel_id = channel_memberships.channel_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'moderator')
    )
  );

-- ==========================================
-- PART 6: HELPER FUNCTIONS
-- ==========================================

-- Function to automatically add creator as owner when creating a channel
CREATE OR REPLACE FUNCTION add_channel_creator_as_owner() RETURNS TRIGGER AS $$
BEGIN
  -- Only add membership for standalone channels (not group channels and not categories)
  IF NEW.group_id IS NULL AND NEW.visibility = 'private' AND NOT (NEW.channel_type = 'category') THEN
    INSERT INTO public.channel_memberships (channel_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add creator as owner
DROP TRIGGER IF EXISTS add_channel_creator_as_owner_trigger ON public.chat_channels;
CREATE TRIGGER add_channel_creator_as_owner_trigger
  AFTER INSERT ON public.chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION add_channel_creator_as_owner();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_channel_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on channel updates
DROP TRIGGER IF EXISTS update_channel_updated_at_trigger ON public.chat_channels;
CREATE TRIGGER update_channel_updated_at_trigger
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_updated_at();

-- ==========================================
-- PART 7: DATA MIGRATION
-- ==========================================

-- Set existing channels to appropriate types
-- Existing general and subject channels become public text channels
UPDATE public.chat_channels 
SET channel_type = 'text', 
    visibility = 'public',
    position = 0
WHERE channel_type IS NULL OR channel_type = '';

-- Set group channels to private
UPDATE public.chat_channels 
SET channel_type = 'text', 
    visibility = 'private'
WHERE group_id IS NOT NULL AND (channel_type IS NULL OR channel_type = '');

-- ==========================================
-- PART 8: ADD CONSTRAINTS
-- ==========================================

-- Ensure categories don't have parent_id (they are top-level)
-- Categories should not have group_id
ALTER TABLE public.chat_channels 
ADD CONSTRAINT check_category_no_parent CHECK (
  channel_type != 'category' OR (parent_id IS NULL AND group_id IS NULL)
);

-- Ensure text/voice channels belong to a category or group
-- (Can be standalone if they are old channels)
-- Categories should have meaningful names
ALTER TABLE public.chat_channels 
ADD CONSTRAINT check_category_name_length CHECK (
  channel_type != 'category' OR length(trim(name)) >= 2
);
