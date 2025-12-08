-- ==========================================
-- PUBLIC DECKS SYSTEM
-- Migration to add public decks sharing functionality
-- ==========================================

-- Table for published decks (flashcard collections shared publicly)
CREATE TABLE IF NOT EXISTS public.public_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'Mathématiques', 'Physique', 'Chimie', 'SI', 'Informatique', 'Anglais', 'Français'
  tags TEXT[] DEFAULT '{}',
  card_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for deck ratings and reviews
CREATE TABLE IF NOT EXISTS public.deck_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Table for tracking deck downloads
CREATE TABLE IF NOT EXISTS public.deck_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for deck likes
CREATE TABLE IF NOT EXISTS public.deck_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_public_decks_author ON public.public_decks(author_id);
CREATE INDEX IF NOT EXISTS idx_public_decks_category ON public.public_decks(category);
CREATE INDEX IF NOT EXISTS idx_public_decks_downloads ON public.public_decks(downloads_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_likes ON public.public_decks(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_rating ON public.public_decks(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_created ON public.public_decks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deck_ratings_deck ON public.deck_ratings(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_ratings_user ON public.deck_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_deck_downloads_deck ON public.deck_downloads(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_downloads_user ON public.deck_downloads(user_id);

CREATE INDEX IF NOT EXISTS idx_deck_likes_deck ON public.deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_user ON public.deck_likes(user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.public_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;

-- Public Decks Policies
DROP POLICY IF EXISTS "Anyone can read published decks" ON public.public_decks;
CREATE POLICY "Anyone can read published decks" ON public.public_decks
  FOR SELECT USING (is_published = true OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can insert their decks" ON public.public_decks;
CREATE POLICY "Authors can insert their decks" ON public.public_decks
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their decks" ON public.public_decks;
CREATE POLICY "Authors can update their decks" ON public.public_decks
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their decks" ON public.public_decks;
CREATE POLICY "Authors can delete their decks" ON public.public_decks
  FOR DELETE USING (auth.uid() = author_id);

-- Deck Ratings Policies
DROP POLICY IF EXISTS "Anyone can read ratings" ON public.deck_ratings;
CREATE POLICY "Anyone can read ratings" ON public.deck_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their ratings" ON public.deck_ratings;
CREATE POLICY "Users can insert their ratings" ON public.deck_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their ratings" ON public.deck_ratings;
CREATE POLICY "Users can update their ratings" ON public.deck_ratings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their ratings" ON public.deck_ratings;
CREATE POLICY "Users can delete their ratings" ON public.deck_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Deck Downloads Policies
DROP POLICY IF EXISTS "Users can read their downloads" ON public.deck_downloads;
CREATE POLICY "Users can read their downloads" ON public.deck_downloads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their downloads" ON public.deck_downloads;
CREATE POLICY "Users can insert their downloads" ON public.deck_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deck Likes Policies
DROP POLICY IF EXISTS "Anyone can read likes" ON public.deck_likes;
CREATE POLICY "Anyone can read likes" ON public.deck_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their likes" ON public.deck_likes;
CREATE POLICY "Users can insert their likes" ON public.deck_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their likes" ON public.deck_likes;
CREATE POLICY "Users can delete their likes" ON public.deck_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- FUNCTIONS FOR AUTO-UPDATE
-- ==========================================

-- Function to update deck statistics after rating
CREATE OR REPLACE FUNCTION update_deck_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
      FROM public.deck_ratings
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update ratings after insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_deck_rating ON public.deck_ratings;
CREATE TRIGGER trigger_update_deck_rating
AFTER INSERT OR UPDATE OR DELETE ON public.deck_ratings
FOR EACH ROW EXECUTE FUNCTION update_deck_rating_stats();

-- Function to update deck likes count
CREATE OR REPLACE FUNCTION update_deck_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    likes_count = (
      SELECT COUNT(*)
      FROM public.deck_likes
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update likes count after insert/delete
DROP TRIGGER IF EXISTS trigger_update_deck_likes ON public.deck_likes;
CREATE TRIGGER trigger_update_deck_likes
AFTER INSERT OR DELETE ON public.deck_likes
FOR EACH ROW EXECUTE FUNCTION update_deck_likes_count();

-- Function to update deck downloads count
CREATE OR REPLACE FUNCTION update_deck_downloads_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    downloads_count = (
      SELECT COUNT(*)
      FROM public.deck_downloads
      WHERE deck_id = NEW.deck_id
    ),
    updated_at = NOW()
  WHERE id = NEW.deck_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update downloads count after insert
DROP TRIGGER IF EXISTS trigger_update_deck_downloads ON public.deck_downloads;
CREATE TRIGGER trigger_update_deck_downloads
AFTER INSERT ON public.deck_downloads
FOR EACH ROW EXECUTE FUNCTION update_deck_downloads_count();
