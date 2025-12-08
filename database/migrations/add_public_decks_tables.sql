-- =========================================
-- Public Decks & Sharing System Migration
-- =========================================

-- Public decks table - stores published flashcard decks
CREATE TABLE IF NOT EXISTS public.public_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  cards_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  source_course_id UUID REFERENCES public.shared_courses(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deck ratings table - stores user ratings and reviews
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

-- Deck downloads table - tracks who downloaded which decks
CREATE TABLE IF NOT EXISTS public.deck_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  imported_course_id UUID REFERENCES public.shared_courses(id),
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Deck likes table - tracks user likes on decks
CREATE TABLE IF NOT EXISTS public.deck_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Deck flashcards junction table - stores which flashcards belong to which public deck
CREATE TABLE IF NOT EXISTS public.deck_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES public.shared_flashcards(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, flashcard_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_public_decks_category ON public.public_decks(category);
CREATE INDEX IF NOT EXISTS idx_public_decks_author ON public.public_decks(author_id);
CREATE INDEX IF NOT EXISTS idx_public_decks_active ON public.public_decks(is_active);
CREATE INDEX IF NOT EXISTS idx_public_decks_created ON public.public_decks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deck_ratings_deck ON public.deck_ratings(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_downloads_user ON public.deck_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_deck ON public.deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_flashcards_deck ON public.deck_flashcards(deck_id);

-- Function to update deck statistics after rating
CREATE OR REPLACE FUNCTION update_deck_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.deck_ratings
      WHERE deck_id = NEW.deck_id
    ),
    ratings_count = (
      SELECT COUNT(*)
      FROM public.deck_ratings
      WHERE deck_id = NEW.deck_id
    ),
    updated_at = NOW()
  WHERE id = NEW.deck_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update rating stats
DROP TRIGGER IF EXISTS trigger_update_deck_rating_stats ON public.deck_ratings;
CREATE TRIGGER trigger_update_deck_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.deck_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_rating_stats();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_deck_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.public_decks
    SET likes_count = likes_count + 1
    WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.public_decks
    SET likes_count = likes_count - 1
    WHERE id = OLD.deck_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes count
DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON public.deck_likes;
CREATE TRIGGER trigger_update_deck_likes_count
  AFTER INSERT OR DELETE ON public.deck_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_likes_count();

-- Function to update downloads count
CREATE OR REPLACE FUNCTION update_deck_downloads_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.deck_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update downloads count
DROP TRIGGER IF EXISTS trigger_update_deck_downloads_count ON public.deck_downloads;
CREATE TRIGGER trigger_update_deck_downloads_count
  AFTER INSERT ON public.deck_downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_downloads_count();

-- Enable Row Level Security (RLS)
ALTER TABLE public.public_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_decks (all can read active decks, only author can update/delete)
CREATE POLICY "Public decks are visible to everyone"
  ON public.public_decks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create decks"
  ON public.public_decks FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own decks"
  ON public.public_decks FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own decks"
  ON public.public_decks FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for deck_ratings
CREATE POLICY "Ratings are visible to everyone"
  ON public.deck_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can rate decks"
  ON public.deck_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.deck_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.deck_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for deck_downloads
CREATE POLICY "Users can see their own downloads"
  ON public.deck_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can record downloads"
  ON public.deck_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for deck_likes
CREATE POLICY "Likes are visible to everyone"
  ON public.deck_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like decks"
  ON public.deck_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike decks"
  ON public.deck_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for deck_flashcards
CREATE POLICY "Deck flashcards are visible to everyone"
  ON public.deck_flashcards FOR SELECT
  USING (true);

CREATE POLICY "Deck authors can add flashcards"
  ON public.deck_flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.public_decks
      WHERE id = deck_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Deck authors can remove flashcards"
  ON public.deck_flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.public_decks
      WHERE id = deck_id AND author_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.public_decks TO authenticated;
GRANT ALL ON public.deck_ratings TO authenticated;
GRANT ALL ON public.deck_downloads TO authenticated;
GRANT ALL ON public.deck_likes TO authenticated;
GRANT ALL ON public.deck_flashcards TO authenticated;
