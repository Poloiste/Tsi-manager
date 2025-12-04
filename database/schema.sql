-- =========================================
-- TSI Manager - Database Schema
-- =========================================

-- Salons de discussion
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'general', 'subject', 'course'
  subject TEXT,  -- Matière (si type = 'subject')
  course_id UUID,  -- Reference to shared_courses if exists
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

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.chat_messages(created_at DESC);
-- Index unique pour les salons généraux et de matière (sans course_id)
-- Les salons de cours peuvent avoir le même nom car ils sont liés à un course_id différent
CREATE UNIQUE INDEX IF NOT EXISTS idx_channels_name_type ON public.chat_channels(name, type) WHERE course_id IS NULL;

-- RLS (Row Level Security)
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Politiques pour chat_channels
DROP POLICY IF EXISTS "Anyone can read channels" ON public.chat_channels;
CREATE POLICY "Anyone can read channels" ON public.chat_channels
  FOR SELECT USING (true);

-- Politiques pour chat_messages
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
CREATE POLICY "Anyone can read messages" ON public.chat_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
CREATE POLICY "Users can delete their own messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

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
