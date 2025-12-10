-- =========================================
-- Group Chats - Database Migration
-- =========================================

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
