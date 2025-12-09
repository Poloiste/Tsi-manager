-- =========================================
-- Study Groups - Database Migration
-- =========================================

-- Table des groupes d'étude
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 20,
  invite_code TEXT UNIQUE,
  invite_code_expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des membres de groupe
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Table des decks partagés dans un groupe
CREATE TABLE IF NOT EXISTS public.study_group_shared_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, course_id)
);

-- Table des activités du groupe (optionnel pour le chat)
CREATE TABLE IF NOT EXISTS public.study_group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'join', 'leave', 'share_deck', 'message'
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_shared_decks_group ON public.study_group_shared_decks(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_activities_group ON public.study_group_activities(group_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_invite_code ON public.study_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_study_groups_public ON public.study_groups(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_shared_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_groups
-- Tous peuvent voir les groupes publics
CREATE POLICY "Public groups are viewable by everyone" ON public.study_groups
  FOR SELECT USING (is_public = true);

-- Les membres peuvent voir leur groupe privé
CREATE POLICY "Members can view their private groups" ON public.study_groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les utilisateurs authentifiés peuvent créer des groupes
CREATE POLICY "Authenticated users can create groups" ON public.study_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Les admins peuvent mettre à jour leur groupe
CREATE POLICY "Group admins can update their groups" ON public.study_groups
  FOR UPDATE USING (
    id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Les admins peuvent supprimer leur groupe
CREATE POLICY "Group admins can delete their groups" ON public.study_groups
  FOR DELETE USING (
    id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for study_group_members
-- Les membres peuvent voir les membres de leur groupe
CREATE POLICY "Group members can view group members" ON public.study_group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les utilisateurs peuvent rejoindre un groupe
CREATE POLICY "Users can join groups" ON public.study_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les membres peuvent quitter un groupe
CREATE POLICY "Members can leave groups" ON public.study_group_members
  FOR DELETE USING (auth.uid() = user_id);

-- Les admins peuvent retirer des membres
CREATE POLICY "Admins can remove members" ON public.study_group_members
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for study_group_shared_decks
-- Les membres peuvent voir les decks partagés
CREATE POLICY "Group members can view shared decks" ON public.study_group_shared_decks
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les membres peuvent partager des decks
CREATE POLICY "Group members can share decks" ON public.study_group_shared_decks
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by AND
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les membres peuvent retirer leurs decks partagés
CREATE POLICY "Members can remove their shared decks" ON public.study_group_shared_decks
  FOR DELETE USING (auth.uid() = shared_by);

-- RLS Policies for study_group_activities
-- Les membres peuvent voir les activités de leur groupe
CREATE POLICY "Group members can view activities" ON public.study_group_activities
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Les membres peuvent créer des activités
CREATE POLICY "Group members can create activities" ON public.study_group_activities
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Fonction pour générer un code d'invitation aléatoire
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sans O, 0, 1, I pour éviter confusion
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement un code d'invitation
CREATE OR REPLACE FUNCTION set_invite_code() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
    -- Définir l'expiration à 7 jours par défaut
    NEW.invite_code_expires_at := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invite_code_trigger
  BEFORE INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_groups_updated_at
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour ajouter automatiquement le créateur comme admin
CREATE OR REPLACE FUNCTION add_creator_as_admin() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.study_group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  
  -- Enregistrer l'activité de création
  INSERT INTO public.study_group_activities (group_id, user_id, activity_type, activity_data)
  VALUES (NEW.id, NEW.created_by, 'create', jsonb_build_object('group_name', NEW.name));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_creator_as_admin_trigger
  AFTER INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_admin();
