-- =========================================
-- Public Decks & Sharing System - Database Tables
-- =========================================

-- Public Decks (published courses with metadata)
CREATE TABLE IF NOT EXISTS public.public_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonyme',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'Mathématiques', 'Physique', 'Chimie', 'SI', 'Informatique', 'Anglais', 'Français', 'Autre'
  tags TEXT[] DEFAULT '{}', -- Max 5 tags
  card_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  rating_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deck Ratings & Reviews
CREATE TABLE IF NOT EXISTS public.deck_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Deck Downloads (track who downloaded what)
CREATE TABLE IF NOT EXISTS public.deck_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Deck Likes
CREATE TABLE IF NOT EXISTS public.deck_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_decks_category ON public.public_decks(category);
CREATE INDEX IF NOT EXISTS idx_public_decks_author ON public.public_decks(author_id);
CREATE INDEX IF NOT EXISTS idx_public_decks_published ON public.public_decks(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_downloads ON public.public_decks(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_rating ON public.public_decks(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_deck_ratings_deck ON public.deck_ratings(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_downloads_user ON public.deck_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_deck ON public.deck_likes(deck_id);

-- Row Level Security
ALTER TABLE public.public_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;

-- Public Decks Policies (everyone can read published decks, only authors can update/delete)
DROP POLICY IF EXISTS "Anyone can view published decks" ON public.public_decks;
CREATE POLICY "Anyone can view published decks" ON public.public_decks
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Authors can view their own decks" ON public.public_decks;
CREATE POLICY "Authors can view their own decks" ON public.public_decks
  FOR SELECT USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can insert their own decks" ON public.public_decks;
CREATE POLICY "Authors can insert their own decks" ON public.public_decks
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own decks" ON public.public_decks;
CREATE POLICY "Authors can update their own decks" ON public.public_decks
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own decks" ON public.public_decks;
CREATE POLICY "Authors can delete their own decks" ON public.public_decks
  FOR DELETE USING (auth.uid() = author_id);

-- Deck Ratings Policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.deck_ratings;
CREATE POLICY "Anyone can view ratings" ON public.deck_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.deck_ratings;
CREATE POLICY "Users can insert their own ratings" ON public.deck_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.deck_ratings;
CREATE POLICY "Users can update their own ratings" ON public.deck_ratings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.deck_ratings;
CREATE POLICY "Users can delete their own ratings" ON public.deck_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Deck Downloads Policies
DROP POLICY IF EXISTS "Anyone can view downloads" ON public.deck_downloads;
CREATE POLICY "Anyone can view downloads" ON public.deck_downloads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.deck_downloads;
CREATE POLICY "Users can insert their own downloads" ON public.deck_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deck Likes Policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.deck_likes;
CREATE POLICY "Anyone can view likes" ON public.deck_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.deck_likes;
CREATE POLICY "Users can insert their own likes" ON public.deck_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.deck_likes;
CREATE POLICY "Users can delete their own likes" ON public.deck_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update deck stats after rating
CREATE OR REPLACE FUNCTION update_deck_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating)::NUMERIC(3,2), 0.00)
      FROM public.deck_ratings
      WHERE deck_id = NEW.deck_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.deck_ratings
      WHERE deck_id = NEW.deck_id
    ),
    updated_at = NOW()
  WHERE id = NEW.deck_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating stats update
DROP TRIGGER IF EXISTS trigger_update_deck_rating_stats ON public.deck_ratings;
CREATE TRIGGER trigger_update_deck_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.deck_ratings
FOR EACH ROW EXECUTE FUNCTION update_deck_rating_stats();

-- Function to update like count
CREATE OR REPLACE FUNCTION update_deck_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    like_count = (
      SELECT COUNT(*)
      FROM public.deck_likes
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for like count update
DROP TRIGGER IF EXISTS trigger_update_deck_like_count ON public.deck_likes;
CREATE TRIGGER trigger_update_deck_like_count
AFTER INSERT OR DELETE ON public.deck_likes
FOR EACH ROW EXECUTE FUNCTION update_deck_like_count();

-- Function to update download count
CREATE OR REPLACE FUNCTION update_deck_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    download_count = (
      SELECT COUNT(*)
      FROM public.deck_downloads
      WHERE deck_id = NEW.deck_id
    ),
    updated_at = NOW()
  WHERE id = NEW.deck_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for download count update
DROP TRIGGER IF EXISTS trigger_update_deck_download_count ON public.deck_downloads;
CREATE TRIGGER trigger_update_deck_download_count
AFTER INSERT ON public.deck_downloads
FOR EACH ROW EXECUTE FUNCTION update_deck_download_count();
