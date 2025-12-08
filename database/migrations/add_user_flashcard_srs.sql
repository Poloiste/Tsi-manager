-- Migration: Add Spaced Repetition System (SRS) table
-- Date: 2025-12-08
-- Description: Adds table to track SRS data for each user's flashcard reviews using SM-2 algorithm

-- Create user_flashcard_srs table
CREATE TABLE IF NOT EXISTS public.user_flashcard_srs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES public.shared_flashcards(id) ON DELETE CASCADE NOT NULL,
  ease_factor NUMERIC(4, 2) DEFAULT 2.5 NOT NULL,  -- SM-2 ease factor (minimum 1.3)
  interval_days INTEGER DEFAULT 0 NOT NULL,         -- Current interval in days
  repetitions INTEGER DEFAULT 0 NOT NULL,           -- Number of successful consecutive repetitions
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- Next review date
  quality_history JSONB DEFAULT '[]' NOT NULL,      -- Array of quality scores (0-5)
  last_reviewed TIMESTAMP WITH TIME ZONE,           -- Last review timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_flashcard_srs_user ON public.user_flashcard_srs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_srs_review_date ON public.user_flashcard_srs(next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_srs_user_review ON public.user_flashcard_srs(user_id, next_review_date);

-- Enable RLS
ALTER TABLE public.user_flashcard_srs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users see only their SRS data" ON public.user_flashcard_srs;
CREATE POLICY "Users see only their SRS data" ON public.user_flashcard_srs
  FOR ALL USING (auth.uid() = user_id);

-- Add comment to document the table
COMMENT ON TABLE public.user_flashcard_srs IS 'Tracks spaced repetition data for each user flashcard using SM-2 algorithm';
COMMENT ON COLUMN public.user_flashcard_srs.ease_factor IS 'SM-2 ease factor (2.5 default, minimum 1.3)';
COMMENT ON COLUMN public.user_flashcard_srs.interval_days IS 'Days until next review';
COMMENT ON COLUMN public.user_flashcard_srs.repetitions IS 'Consecutive successful reviews';
COMMENT ON COLUMN public.user_flashcard_srs.quality_history IS 'Array of quality scores from reviews (0-5)';
