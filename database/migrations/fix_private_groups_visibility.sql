-- =========================================
-- Fix Private Groups Visibility
-- =========================================
-- This migration fixes the visibility of private groups by consolidating
-- the RLS policies to ensure that private groups are visible to their
-- creators and members.

-- Drop existing SELECT policies for study_groups
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.study_groups;
DROP POLICY IF EXISTS "Members can view their private groups" ON public.study_groups;

-- Create a single consolidated policy for group visibility
-- This allows:
-- 1. Public groups to be visible to everyone
-- 2. Private groups to be visible to their creator
-- 3. Private groups to be visible to their members
CREATE POLICY "Allow group visibility" ON public.study_groups
  FOR SELECT
  USING (
    is_public = true OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1
      FROM public.study_group_members
      WHERE study_group_members.group_id = study_groups.id
        AND study_group_members.user_id = auth.uid()
    )
  );
