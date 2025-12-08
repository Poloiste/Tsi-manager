-- =========================================
-- TSI Manager - Gamification Tables Migration
-- =========================================

-- ==========================================
-- BADGES SYSTEM
-- ==========================================

-- Table des badges disponibles
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
  condition_type TEXT NOT NULL, -- streak, mastery, cards_created, sessions_count
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des badges débloqués par utilisateur
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ==========================================
-- USER PROFILES (GAMIFICATION)
-- ==========================================

-- Profil utilisateur avec XP et stats globales
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  cards_created INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  incorrect_reviews INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- DAILY STATS
-- ==========================================

-- Statistiques journalières pour la heatmap
CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reviews_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.user_daily_stats(user_id, date DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

-- Badges (lecture publique)
DROP POLICY IF EXISTS "Anyone can read badges" ON public.badges;
CREATE POLICY "Anyone can read badges" ON public.badges
  FOR SELECT USING (true);

-- User Badges (lecture par utilisateur)
DROP POLICY IF EXISTS "Users see only their badges" ON public.user_badges;
CREATE POLICY "Users see only their badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their badges" ON public.user_badges;
CREATE POLICY "Users can insert their badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Profiles (lecture/écriture par utilisateur)
DROP POLICY IF EXISTS "Users see only their profile" ON public.user_profiles;
CREATE POLICY "Users see only their profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- User Daily Stats (lecture/écriture par utilisateur)
DROP POLICY IF EXISTS "Users see only their daily stats" ON public.user_daily_stats;
CREATE POLICY "Users see only their daily stats" ON public.user_daily_stats
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- SEED BADGES DATA
-- ==========================================

-- Insérer les badges par défaut
INSERT INTO public.badges (badge_key, name, description, icon, xp_reward, rarity, condition_type, condition_value) VALUES
  -- Streak badges
  ('streak_3', 'Débutant assidu', 'Révisez 3 jours d''affilée', '🔥', 50, 'common', 'streak', 3),
  ('streak_7', 'Semaine parfaite', 'Révisez 7 jours d''affilée', '🔥', 100, 'rare', 'streak', 7),
  ('streak_30', 'Champion du mois', 'Révisez 30 jours d''affilée', '🔥', 300, 'epic', 'streak', 30),
  ('streak_100', 'Légende vivante', 'Révisez 100 jours d''affilée', '🔥', 1000, 'legendary', 'streak', 100),
  
  -- Mastery badges (cartes maîtrisées)
  ('mastery_10', 'Expert naissant', 'Maîtrisez 10 cartes (interval > 21j)', '⭐', 75, 'common', 'mastery', 10),
  ('mastery_50', 'Maître éclairé', 'Maîtrisez 50 cartes', '⭐', 200, 'rare', 'mastery', 50),
  ('mastery_100', 'Sage accompli', 'Maîtrisez 100 cartes', '⭐', 500, 'epic', 'mastery', 100),
  ('mastery_500', 'Génie absolu', 'Maîtrisez 500 cartes', '⭐', 2000, 'legendary', 'mastery', 500),
  
  -- Cards creation badges
  ('first_card', 'Premier pas', 'Créez votre première carte', '📝', 25, 'common', 'cards_created', 1),
  ('cards_created_50', 'Créateur prolifique', 'Créez 50 cartes', '📝', 150, 'rare', 'cards_created', 50),
  
  -- Session badges
  ('first_review', 'Première révision', 'Complétez votre première session', '📚', 25, 'common', 'sessions_count', 1),
  ('sessions_10', 'Étudiant régulier', 'Complétez 10 sessions', '📚', 100, 'common', 'sessions_count', 10),
  ('sessions_50', 'Révisionneur dévoué', 'Complétez 50 sessions', '📚', 300, 'rare', 'sessions_count', 50),
  ('sessions_100', 'Marathonien du savoir', 'Complétez 100 sessions', '📚', 750, 'epic', 'sessions_count', 100)
ON CONFLICT (badge_key) DO NOTHING;

-- ==========================================
-- FUNCTIONS FOR AUTOMATIC PROFILE CREATION
-- ==========================================

-- Function to create user profile on first activity
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation on first badge
CREATE TRIGGER ensure_profile_on_badge
  BEFORE INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();

-- Trigger for automatic profile creation on first daily stat
CREATE TRIGGER ensure_profile_on_daily_stat
  BEFORE INSERT ON public.user_daily_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();
