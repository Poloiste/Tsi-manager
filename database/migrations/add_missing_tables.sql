-- =========================================
-- TSI Manager - Missing Tables Migration
-- Date: 2025-12-09
-- Description: Creates all missing tables referenced in application code
-- =========================================

-- ==========================================
-- PART 1: USER PERSONAL DATA TABLES
-- ==========================================

-- User Revision History
-- Tracks user's revision sessions with details
CREATE TABLE IF NOT EXISTS public.user_revision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  duration INTEGER NOT NULL, -- Duration in minutes
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Schedules (Weekly schedule/timetable)
-- Stores user's weekly class schedule
CREATE TABLE IF NOT EXISTS public.user_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Monday, 6=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Exams (DS/DM/Colles tracking)
-- Tracks upcoming and past exams
CREATE TABLE IF NOT EXISTS public.user_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'DS', 'DM', 'Colle'
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER, -- Duration in minutes
  coefficient NUMERIC(3, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Weekly Planning
-- Stores weekly planning and tasks
CREATE TABLE IF NOT EXISTS public.user_weekly_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL, -- ISO week number
  year INTEGER NOT NULL,
  tasks JSONB DEFAULT '[]', -- Array of tasks
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_number, year)
);

-- User Goals (Weekly goals for gamification)
-- Stores user's weekly study goals
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL, -- 'weekly_reviews', 'cards_mastered', 'study_time'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_type, week_number, year)
);

-- ==========================================
-- PART 2: SHARED DATA TABLES
-- ==========================================

-- Shared Revisions
-- Stores shared revision materials and resources
CREATE TABLE IF NOT EXISTS public.shared_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT, -- 'formula', 'summary', 'method', 'tip'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PART 3: PUBLIC DECKS / COMMUNITY TABLES
-- ==========================================

-- Public Decks (Community shared flashcard decks)
-- Stores published flashcard decks for community sharing
CREATE TABLE IF NOT EXISTS public.public_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'Mathématiques', 'Physique', 'Chimie', 'SI', 'Informatique', 'Anglais', 'Français', 'Autre'
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_by_name TEXT DEFAULT 'Anonyme',
  card_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deck Ratings (User reviews and ratings)
-- Stores user ratings and reviews for public decks
CREATE TABLE IF NOT EXISTS public.deck_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Deck Downloads (Track who downloaded which deck)
-- Tracks deck download events
CREATE TABLE IF NOT EXISTS public.deck_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Deck Likes (Track who liked which deck)
-- Stores user likes for public decks
CREATE TABLE IF NOT EXISTS public.deck_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- ==========================================
-- PART 4: GROUP CHALLENGES (GAMIFICATION)
-- ==========================================

-- Group Challenges
-- Stores challenges for study groups
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- 'reviews', 'mastery', 'streak', 'study_time'
  target_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Challenge Progress
-- Tracks individual user progress on group challenges
CREATE TABLE IF NOT EXISTS public.group_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.group_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ==========================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ==========================================

-- User Revision History indexes
CREATE INDEX IF NOT EXISTS idx_user_revision_history_user ON public.user_revision_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_revision_history_date ON public.user_revision_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_revision_history_user_date ON public.user_revision_history(user_id, date DESC);

-- User Schedules indexes
CREATE INDEX IF NOT EXISTS idx_user_schedules_user ON public.user_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_schedules_day ON public.user_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_user_schedules_user_day ON public.user_schedules(user_id, day_of_week);

-- User Exams indexes
CREATE INDEX IF NOT EXISTS idx_user_exams_user ON public.user_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_date ON public.user_exams(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_exams_user_date ON public.user_exams(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_exams_type ON public.user_exams(type);

-- User Weekly Planning indexes
CREATE INDEX IF NOT EXISTS idx_user_weekly_planning_user ON public.user_weekly_planning(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weekly_planning_week ON public.user_weekly_planning(year DESC, week_number DESC);

-- User Goals indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_week ON public.user_goals(year DESC, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_achieved ON public.user_goals(achieved);

-- Shared Revisions indexes
CREATE INDEX IF NOT EXISTS idx_shared_revisions_subject ON public.shared_revisions(subject);
CREATE INDEX IF NOT EXISTS idx_shared_revisions_type ON public.shared_revisions(type);
CREATE INDEX IF NOT EXISTS idx_shared_revisions_created ON public.shared_revisions(created_at DESC);

-- Public Decks indexes
CREATE INDEX IF NOT EXISTS idx_public_decks_category ON public.public_decks(category);
CREATE INDEX IF NOT EXISTS idx_public_decks_created_by ON public.public_decks(created_by);
CREATE INDEX IF NOT EXISTS idx_public_decks_published ON public.public_decks(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_public_decks_rating ON public.public_decks(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_downloads ON public.public_decks(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_created ON public.public_decks(created_at DESC);

-- Deck Ratings indexes
CREATE INDEX IF NOT EXISTS idx_deck_ratings_deck ON public.deck_ratings(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_ratings_user ON public.deck_ratings(user_id);

-- Deck Downloads indexes
CREATE INDEX IF NOT EXISTS idx_deck_downloads_deck ON public.deck_downloads(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_downloads_user ON public.deck_downloads(user_id);

-- Deck Likes indexes
CREATE INDEX IF NOT EXISTS idx_deck_likes_deck ON public.deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_user ON public.deck_likes(user_id);

-- Group Challenges indexes
CREATE INDEX IF NOT EXISTS idx_group_challenges_group ON public.group_challenges(group_id);
CREATE INDEX IF NOT EXISTS idx_group_challenges_dates ON public.group_challenges(start_date, end_date);

-- Group Challenge Progress indexes
CREATE INDEX IF NOT EXISTS idx_group_challenge_progress_challenge ON public.group_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_group_challenge_progress_user ON public.group_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_group_challenge_progress_completed ON public.group_challenge_progress(completed);

-- ==========================================
-- PART 6: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_revision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weekly_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenge_progress ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 7: RLS POLICIES - USER PERSONAL DATA
-- ==========================================

-- User Revision History Policies
DROP POLICY IF EXISTS "Users see only their revision history" ON public.user_revision_history;
CREATE POLICY "Users see only their revision history" ON public.user_revision_history
  FOR ALL USING (auth.uid() = user_id);

-- User Schedules Policies
DROP POLICY IF EXISTS "Users see only their schedules" ON public.user_schedules;
CREATE POLICY "Users see only their schedules" ON public.user_schedules
  FOR ALL USING (auth.uid() = user_id);

-- User Exams Policies
DROP POLICY IF EXISTS "Users see only their exams" ON public.user_exams;
CREATE POLICY "Users see only their exams" ON public.user_exams
  FOR ALL USING (auth.uid() = user_id);

-- User Weekly Planning Policies
DROP POLICY IF EXISTS "Users see only their weekly planning" ON public.user_weekly_planning;
CREATE POLICY "Users see only their weekly planning" ON public.user_weekly_planning
  FOR ALL USING (auth.uid() = user_id);

-- User Goals Policies
DROP POLICY IF EXISTS "Users see only their goals" ON public.user_goals;
CREATE POLICY "Users see only their goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- PART 8: RLS POLICIES - SHARED DATA
-- ==========================================

-- Shared Revisions Policies
DROP POLICY IF EXISTS "Anyone can read shared revisions" ON public.shared_revisions;
CREATE POLICY "Anyone can read shared revisions" ON public.shared_revisions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert revisions" ON public.shared_revisions;
CREATE POLICY "Authenticated users can insert revisions" ON public.shared_revisions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own revisions" ON public.shared_revisions;
CREATE POLICY "Users can update their own revisions" ON public.shared_revisions
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own revisions" ON public.shared_revisions;
CREATE POLICY "Users can delete their own revisions" ON public.shared_revisions
  FOR DELETE USING (auth.uid() = created_by);

-- ==========================================
-- PART 9: RLS POLICIES - PUBLIC DECKS
-- ==========================================

-- Public Decks Policies
DROP POLICY IF EXISTS "Published decks are viewable by everyone" ON public.public_decks;
CREATE POLICY "Published decks are viewable by everyone" ON public.public_decks
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Users can view their own unpublished decks" ON public.public_decks;
CREATE POLICY "Users can view their own unpublished decks" ON public.public_decks
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can publish decks" ON public.public_decks;
CREATE POLICY "Authenticated users can publish decks" ON public.public_decks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own decks" ON public.public_decks;
CREATE POLICY "Users can update their own decks" ON public.public_decks
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own decks" ON public.public_decks;
CREATE POLICY "Users can delete their own decks" ON public.public_decks
  FOR DELETE USING (auth.uid() = created_by);

-- Deck Ratings Policies
DROP POLICY IF EXISTS "Anyone can read ratings" ON public.deck_ratings;
CREATE POLICY "Anyone can read ratings" ON public.deck_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can rate decks" ON public.deck_ratings;
CREATE POLICY "Authenticated users can rate decks" ON public.deck_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.deck_ratings;
CREATE POLICY "Users can update their own ratings" ON public.deck_ratings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.deck_ratings;
CREATE POLICY "Users can delete their own ratings" ON public.deck_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Deck Downloads Policies
DROP POLICY IF EXISTS "Users can view their downloads" ON public.deck_downloads;
CREATE POLICY "Users can view their downloads" ON public.deck_downloads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can download decks" ON public.deck_downloads;
CREATE POLICY "Authenticated users can download decks" ON public.deck_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deck Likes Policies
DROP POLICY IF EXISTS "Anyone can read likes" ON public.deck_likes;
CREATE POLICY "Anyone can read likes" ON public.deck_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like decks" ON public.deck_likes;
CREATE POLICY "Authenticated users can like decks" ON public.deck_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike decks" ON public.deck_likes;
CREATE POLICY "Users can unlike decks" ON public.deck_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- PART 10: RLS POLICIES - GROUP CHALLENGES
-- ==========================================

-- Group Challenges Policies
DROP POLICY IF EXISTS "Group members can view challenges" ON public.group_challenges;
CREATE POLICY "Group members can view challenges" ON public.group_challenges
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group admins can create challenges" ON public.group_challenges;
CREATE POLICY "Group admins can create challenges" ON public.group_challenges
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Group admins can update challenges" ON public.group_challenges;
CREATE POLICY "Group admins can update challenges" ON public.group_challenges
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Group admins can delete challenges" ON public.group_challenges;
CREATE POLICY "Group admins can delete challenges" ON public.group_challenges
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group Challenge Progress Policies
DROP POLICY IF EXISTS "Users can view challenge progress" ON public.group_challenge_progress;
CREATE POLICY "Users can view challenge progress" ON public.group_challenge_progress
  FOR SELECT USING (
    challenge_id IN (
      SELECT gc.id FROM public.group_challenges gc
      JOIN public.study_group_members sgm ON gc.group_id = sgm.group_id
      WHERE sgm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can track their own progress" ON public.group_challenge_progress;
CREATE POLICY "Users can track their own progress" ON public.group_challenge_progress
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- PART 11: TRIGGERS AND FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at on tables
CREATE TRIGGER update_user_revision_history_timestamp
  BEFORE UPDATE ON public.user_revision_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_user_exams_timestamp
  BEFORE UPDATE ON public.user_exams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_user_weekly_planning_timestamp
  BEFORE UPDATE ON public.user_weekly_planning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_user_goals_timestamp
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_shared_revisions_timestamp
  BEFORE UPDATE ON public.shared_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_public_decks_timestamp
  BEFORE UPDATE ON public.public_decks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_deck_ratings_timestamp
  BEFORE UPDATE ON public.deck_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_group_challenge_progress_timestamp
  BEFORE UPDATE ON public.group_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- ==========================================
-- PART 12: AUTOMATIC STATS UPDATES FOR PUBLIC DECKS
-- ==========================================

-- Function to update deck stats after rating
CREATE OR REPLACE FUNCTION public.update_deck_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET 
    average_rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM public.deck_ratings
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.deck_ratings
      WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
    )
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for rating stats
CREATE TRIGGER update_deck_rating_stats_on_insert
  AFTER INSERT ON public.deck_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deck_rating_stats();

CREATE TRIGGER update_deck_rating_stats_on_update
  AFTER UPDATE ON public.deck_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deck_rating_stats();

CREATE TRIGGER update_deck_rating_stats_on_delete
  AFTER DELETE ON public.deck_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deck_rating_stats();

-- Function to update deck like count
CREATE OR REPLACE FUNCTION public.update_deck_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET like_count = (
    SELECT COUNT(*)
    FROM public.deck_likes
    WHERE deck_id = COALESCE(NEW.deck_id, OLD.deck_id)
  )
  WHERE id = COALESCE(NEW.deck_id, OLD.deck_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for like count
CREATE TRIGGER update_deck_like_count_on_insert
  AFTER INSERT ON public.deck_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deck_like_count();

CREATE TRIGGER update_deck_like_count_on_delete
  AFTER DELETE ON public.deck_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deck_like_count();

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_deck_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.public_decks
  SET download_count = download_count + 1
  WHERE id = NEW.deck_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for download count
CREATE TRIGGER increment_deck_download_count_on_insert
  AFTER INSERT ON public.deck_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_deck_download_count();

-- Function to set card count on deck creation/update
CREATE OR REPLACE FUNCTION public.update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.card_count = (
    SELECT COUNT(*)
    FROM public.shared_flashcards
    WHERE course_id = NEW.course_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for card count
CREATE TRIGGER update_deck_card_count_on_insert_or_update
  BEFORE INSERT OR UPDATE ON public.public_decks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deck_card_count();

-- ==========================================
-- PART 13: COMMENTS FOR DOCUMENTATION
-- ==========================================

-- User Revision History
COMMENT ON TABLE public.user_revision_history IS 'Tracks user revision sessions with subject, duration, and notes';
COMMENT ON COLUMN public.user_revision_history.duration IS 'Duration of revision session in minutes';

-- User Schedules
COMMENT ON TABLE public.user_schedules IS 'Stores user weekly class schedules';
COMMENT ON COLUMN public.user_schedules.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday';

-- User Exams
COMMENT ON TABLE public.user_exams IS 'Tracks user exams (DS, DM, Colles)';
COMMENT ON COLUMN public.user_exams.type IS 'Type of exam: DS (Devoir Surveillé), DM (Devoir Maison), or Colle';
COMMENT ON COLUMN public.user_exams.coefficient IS 'Exam coefficient for grade calculation';

-- User Weekly Planning
COMMENT ON TABLE public.user_weekly_planning IS 'Stores user weekly planning and tasks';
COMMENT ON COLUMN public.user_weekly_planning.week_number IS 'ISO week number (1-53)';
COMMENT ON COLUMN public.user_weekly_planning.tasks IS 'JSONB array of weekly tasks';

-- User Goals
COMMENT ON TABLE public.user_goals IS 'Tracks user weekly study goals for gamification';
COMMENT ON COLUMN public.user_goals.goal_type IS 'Type: weekly_reviews, cards_mastered, or study_time';

-- Shared Revisions
COMMENT ON TABLE public.shared_revisions IS 'Community-shared revision materials and resources';
COMMENT ON COLUMN public.shared_revisions.type IS 'Type: formula, summary, method, or tip';

-- Public Decks
COMMENT ON TABLE public.public_decks IS 'Published flashcard decks shared with the community';
COMMENT ON COLUMN public.public_decks.category IS 'Subject category for filtering';
COMMENT ON COLUMN public.public_decks.tags IS 'Array of searchable tags';

-- Deck Ratings
COMMENT ON TABLE public.deck_ratings IS 'User ratings and reviews for public decks';
COMMENT ON COLUMN public.deck_ratings.rating IS 'Rating from 1 to 5 stars';

-- Deck Downloads
COMMENT ON TABLE public.deck_downloads IS 'Tracks which users downloaded which decks';

-- Deck Likes
COMMENT ON TABLE public.deck_likes IS 'Tracks user likes for public decks';

-- Group Challenges
COMMENT ON TABLE public.group_challenges IS 'Study group challenges for gamification';
COMMENT ON COLUMN public.group_challenges.challenge_type IS 'Type: reviews, mastery, streak, or study_time';

-- Group Challenge Progress
COMMENT ON TABLE public.group_challenge_progress IS 'Tracks individual user progress on group challenges';
