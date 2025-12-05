-- Migration: Add author name and import tracking to flashcards
-- Date: 2025-12-05
-- Description: Adds columns to track who created flashcards and from which source they were imported

-- Add new columns to shared_flashcards table
ALTER TABLE public.shared_flashcards 
ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT 'Anonyme',
ADD COLUMN IF NOT EXISTS imported_from TEXT DEFAULT NULL;

-- Add comment to document the columns
COMMENT ON COLUMN public.shared_flashcards.created_by_name IS 'Name of the user who created the flashcard';
COMMENT ON COLUMN public.shared_flashcards.imported_from IS 'Source of import: anki, csv, noji, notion, or NULL if manually created';

-- Add UPDATE policy for flashcards (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shared_flashcards' 
    AND policyname = 'Users can update their own flashcards'
  ) THEN
    CREATE POLICY "Users can update their own flashcards" ON public.shared_flashcards
      FOR UPDATE USING (auth.uid() = created_by);
  END IF;
END $$;

-- Update existing flashcards to populate created_by_name from auth.users
-- WARNING: This section requires access to auth.users which may not be available in RLS context
-- OPTIONS:
--   1. Run this as a Supabase service role (in SQL Editor with service role key)
--   2. Run via Supabase CLI: supabase db push
--   3. Skip this section if you don't have existing flashcards
--   4. Manually update using a server-side script with service role key

-- Uncomment the following block to update existing flashcard author names:
/*
UPDATE public.shared_flashcards 
SET created_by_name = COALESCE(
  (SELECT COALESCE(
    raw_user_meta_data->>'name',
    split_part(email, '@', 1),
    'Anonyme'
  ) FROM auth.users WHERE id = created_by),
  'Anonyme'
)
WHERE created_by_name = 'Anonyme' AND created_by IS NOT NULL;
*/

-- Alternative: Create a PostgreSQL function that can be called with proper privileges
-- This function can be executed by the Supabase service role
CREATE OR REPLACE FUNCTION public.update_flashcard_authors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shared_flashcards 
  SET created_by_name = COALESCE(
    (SELECT COALESCE(
      raw_user_meta_data->>'name',
      split_part(email, '@', 1),
      'Anonyme'
    ) FROM auth.users WHERE id = created_by),
    'Anonyme'
  )
  WHERE created_by_name = 'Anonyme' AND created_by IS NOT NULL;
END;
$$;

-- To update existing flashcards, call this function from SQL Editor or via RPC:
-- SELECT public.update_flashcard_authors();
