-- =========================================
-- TSI Manager - Database Schema
-- =========================================

-- ==========================================
-- SHARED DATA (visible to all users)
-- ==========================================

-- Cours partagés entre tous les utilisateurs
CREATE TABLE IF NOT EXISTS public.shared_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  content TEXT,
  difficulty INTEGER DEFAULT 3,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Liens OneDrive partagés pour les cours
CREATE TABLE IF NOT EXISTS public.shared_course_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards partagées entre tous les utilisateurs
CREATE TABLE IF NOT EXISTS public.shared_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT DEFAULT 'Anonyme',
  imported_from TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PERSONAL DATA (filtered by user_id)
-- ==========================================

-- Événements personnels (DS, Colles, DM)
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  date DATE,
  time TEXT,
  week INTEGER,
  day TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progression personnelle sur les cours
CREATE TABLE IF NOT EXISTS public.user_revision_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  mastery INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  review_history JSONB DEFAULT '[]',
  UNIQUE(user_id, course_id)
);

-- Statistiques personnelles sur les flashcards
CREATE TABLE IF NOT EXISTS public.user_flashcard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES public.shared_flashcards(id) ON DELETE CASCADE,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, flashcard_id)
);

-- ==========================================
-- CHAT SYSTEM
-- ==========================================

-- Salons de discussion
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'general', 'subject', 'course'
  subject TEXT,  -- Matière (si type = 'subject')
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Shared data indexes
CREATE INDEX IF NOT EXISTS idx_courses_subject ON public.shared_courses(subject);
CREATE INDEX IF NOT EXISTS idx_course_links_course ON public.shared_course_links(course_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_course ON public.shared_flashcards(course_id);

-- Personal data indexes
CREATE INDEX IF NOT EXISTS idx_user_events_user ON public.user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON public.user_events(date);
CREATE INDEX IF NOT EXISTS idx_revision_progress_user ON public.user_revision_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_stats_user ON public.user_flashcard_stats(user_id);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.chat_messages(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_name_type ON public.chat_channels(name, type) WHERE course_id IS NULL;

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.shared_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_course_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_revision_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- SHARED DATA POLICIES
-- ==========================================

-- Shared Courses
DROP POLICY IF EXISTS "Anyone can read courses" ON public.shared_courses;
CREATE POLICY "Anyone can read courses" ON public.shared_courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert courses" ON public.shared_courses;
CREATE POLICY "Authenticated users can insert courses" ON public.shared_courses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own courses" ON public.shared_courses;
CREATE POLICY "Users can delete their own courses" ON public.shared_courses
  FOR DELETE USING (auth.uid() = created_by);

-- Shared Course Links
DROP POLICY IF EXISTS "Anyone can read course links" ON public.shared_course_links;
CREATE POLICY "Anyone can read course links" ON public.shared_course_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert links" ON public.shared_course_links;
CREATE POLICY "Authenticated users can insert links" ON public.shared_course_links
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own links" ON public.shared_course_links;
CREATE POLICY "Users can delete their own links" ON public.shared_course_links
  FOR DELETE USING (auth.uid() = added_by);

-- Shared Flashcards
DROP POLICY IF EXISTS "Anyone can read flashcards" ON public.shared_flashcards;
CREATE POLICY "Anyone can read flashcards" ON public.shared_flashcards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert flashcards" ON public.shared_flashcards;
CREATE POLICY "Authenticated users can insert flashcards" ON public.shared_flashcards
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.shared_flashcards;
CREATE POLICY "Users can update their own flashcards" ON public.shared_flashcards
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.shared_flashcards;
CREATE POLICY "Users can delete their own flashcards" ON public.shared_flashcards
  FOR DELETE USING (auth.uid() = created_by);

-- ==========================================
-- PERSONAL DATA POLICIES
-- ==========================================

-- User Events
DROP POLICY IF EXISTS "Users see only their events" ON public.user_events;
CREATE POLICY "Users see only their events" ON public.user_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their events" ON public.user_events;
CREATE POLICY "Users insert their events" ON public.user_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their events" ON public.user_events;
CREATE POLICY "Users delete their events" ON public.user_events
  FOR DELETE USING (auth.uid() = user_id);

-- User Revision Progress
DROP POLICY IF EXISTS "Users see only their progress" ON public.user_revision_progress;
CREATE POLICY "Users see only their progress" ON public.user_revision_progress
  FOR ALL USING (auth.uid() = user_id);

-- User Flashcard Stats
DROP POLICY IF EXISTS "Users see only their flashcard stats" ON public.user_flashcard_stats;
CREATE POLICY "Users see only their flashcard stats" ON public.user_flashcard_stats
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- CHAT POLICIES
-- ==========================================

-- Chat Channels
-- Allow all authenticated users to read channels
DROP POLICY IF EXISTS "Anyone can read channels" ON public.chat_channels;
CREATE POLICY "Anyone can read channels" ON public.chat_channels
  FOR SELECT USING (true);

-- Chat Messages
-- Allow all authenticated users to read messages
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
CREATE POLICY "Anyone can read messages" ON public.chat_messages
  FOR SELECT USING (true);

-- Allow authenticated users to send messages
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to delete only their own messages
-- This ensures users can only delete messages where user_id matches their auth.uid()
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
CREATE POLICY "Users can delete their own messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- GROUPES (STUDY GROUPS)
-- ==========================================

-- Table des groupes d'étude
CREATE TABLE IF NOT EXISTS public.groupes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_groupes_date_creation ON public.groupes(date_creation DESC);

-- Enable Row Level Security
ALTER TABLE public.groupes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groupes
-- Tous peuvent voir les groupes
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groupes;
CREATE POLICY "Anyone can view groups" ON public.groupes
  FOR SELECT USING (true);

-- Les utilisateurs authentifiés peuvent créer des groupes
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groupes;
CREATE POLICY "Authenticated users can create groups" ON public.groupes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Les utilisateurs authentifiés peuvent mettre à jour leurs propres groupes
DROP POLICY IF EXISTS "Authenticated users can update groups" ON public.groupes;
CREATE POLICY "Authenticated users can update groups" ON public.groupes
  FOR UPDATE USING (auth.uid() = created_by);

-- Les utilisateurs authentifiés peuvent supprimer leurs propres groupes
DROP POLICY IF EXISTS "Authenticated users can delete groups" ON public.groupes;
CREATE POLICY "Authenticated users can delete groups" ON public.groupes
  FOR DELETE USING (auth.uid() = created_by);

-- ==========================================
-- GROUP CHATS
-- ==========================================

-- Table des messages de chat de groupe
CREATE TABLE IF NOT EXISTS public.group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_group_chats_group ON public.group_chats(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chats_created ON public.group_chats(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_chats
-- Les membres peuvent lire les messages de leur groupe
DROP POLICY IF EXISTS "Group members can read group messages" ON public.group_chats;
CREATE POLICY "Group members can read group messages" ON public.group_chats
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les membres peuvent envoyer des messages dans leur groupe
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_chats;
CREATE POLICY "Group members can send messages" ON public.group_chats
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent supprimer leurs propres messages
DROP POLICY IF EXISTS "Users can delete their own group messages" ON public.group_chats;
CREATE POLICY "Users can delete their own group messages" ON public.group_chats
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- DEFAULT DATA
-- ==========================================

-- Insérer les salons par défaut
INSERT INTO public.chat_channels (name, type, subject) VALUES
  ('Général', 'general', NULL),
  ('Maths', 'subject', 'Maths'),
  ('Physique', 'subject', 'Physique'),
  ('Méca', 'subject', 'Méca'),
  ('Elec', 'subject', 'Elec'),
  ('Anglais', 'subject', 'Anglais'),
  ('Français', 'subject', 'Français'),
  ('Informatique', 'subject', 'Informatique')
ON CONFLICT (name, type) WHERE course_id IS NULL DO NOTHING;
