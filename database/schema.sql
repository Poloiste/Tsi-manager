-- ============================================
-- TSI MANAGER - SCHEMA SUPABASE
-- ============================================
-- Ce fichier contient toutes les commandes SQL nécessaires
-- pour configurer votre base de données Supabase.
-- 
-- Instructions :
-- 1. Connectez-vous à https://supabase.com/
-- 2. Ouvrez votre projet
-- 3. Allez dans "SQL Editor"
-- 4. Copiez-collez ce fichier et exécutez-le
-- ============================================

-- ============================================
-- TABLE: SHARED COURSES (Cours partagés)
-- ============================================
-- Les cours sont partagés entre tous les utilisateurs
-- Chaque utilisateur peut ajouter des cours visibles par tous

CREATE TABLE IF NOT EXISTS public.shared_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  content TEXT,
  difficulty INTEGER DEFAULT 3,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shared_courses_subject ON public.shared_courses(subject);
CREATE INDEX IF NOT EXISTS idx_shared_courses_created_by ON public.shared_courses(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_courses_created_at ON public.shared_courses(created_at);

-- Activer Row Level Security
ALTER TABLE public.shared_courses ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : Tout le monde peut lire, seuls les authentifiés peuvent créer
DROP POLICY IF EXISTS "Anyone can read courses" ON public.shared_courses;
CREATE POLICY "Anyone can read courses" ON public.shared_courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert courses" ON public.shared_courses;
CREATE POLICY "Authenticated users can insert courses" ON public.shared_courses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own courses" ON public.shared_courses;
CREATE POLICY "Users can update their own courses" ON public.shared_courses
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own courses" ON public.shared_courses;
CREATE POLICY "Users can delete their own courses" ON public.shared_courses
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================
-- TABLE: SHARED COURSE LINKS (Liens OneDrive partagés)
-- ============================================
-- Liens OneDrive associés aux cours

CREATE TABLE IF NOT EXISTS public.shared_course_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shared_course_links_course_id ON public.shared_course_links(course_id);
CREATE INDEX IF NOT EXISTS idx_shared_course_links_added_by ON public.shared_course_links(added_by);

-- Activer Row Level Security
ALTER TABLE public.shared_course_links ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Anyone can read course links" ON public.shared_course_links;
CREATE POLICY "Anyone can read course links" ON public.shared_course_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert links" ON public.shared_course_links;
CREATE POLICY "Authenticated users can insert links" ON public.shared_course_links
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own links" ON public.shared_course_links;
CREATE POLICY "Users can delete their own links" ON public.shared_course_links
  FOR DELETE USING (auth.uid() = added_by);

-- ============================================
-- TABLE: SHARED FLASHCARDS (Flashcards partagées)
-- ============================================
-- Les flashcards sont partagées entre tous les utilisateurs
-- Liées aux cours par course_id

CREATE TABLE IF NOT EXISTS public.shared_flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.shared_courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shared_flashcards_course_id ON public.shared_flashcards(course_id);
CREATE INDEX IF NOT EXISTS idx_shared_flashcards_created_by ON public.shared_flashcards(created_by);
CREATE INDEX IF NOT EXISTS idx_shared_flashcards_created_at ON public.shared_flashcards(created_at);

-- Activer Row Level Security
ALTER TABLE public.shared_flashcards ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Anyone can read flashcards" ON public.shared_flashcards;
CREATE POLICY "Anyone can read flashcards" ON public.shared_flashcards
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert flashcards" ON public.shared_flashcards;
CREATE POLICY "Authenticated users can insert flashcards" ON public.shared_flashcards
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own flashcards" ON public.shared_flashcards;
CREATE POLICY "Users can delete their own flashcards" ON public.shared_flashcards
  FOR DELETE USING (auth.uid() = created_by);

-- ============================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================

COMMENT ON TABLE public.shared_courses IS 'Cours partagés entre tous les utilisateurs TSI';
COMMENT ON TABLE public.shared_course_links IS 'Liens OneDrive associés aux cours';
COMMENT ON TABLE public.shared_flashcards IS 'Flashcards de révision partagées, liées aux cours';

-- ============================================
-- FIN DU SCHEMA
-- ============================================
-- ✅ Exécutez ce script dans le SQL Editor de Supabase
-- ✅ Vérifiez que les tables sont créées dans "Table Editor"
-- ✅ Configurez vos variables d'environnement dans le frontend
--
-- 🔒 Vérification des politiques RLS :
-- Testez que RLS fonctionne avec ces requêtes :
--
-- 1. Test lecture publique (doit fonctionner même déconnecté) :
--    SELECT * FROM shared_courses LIMIT 5;
--
-- 2. Test création (doit échouer si non authentifié) :
--    INSERT INTO shared_courses (subject, chapter, content) 
--    VALUES ('Test', 'Test Chapter', 'Test');
--
-- 3. Vérifier que RLS est activé sur toutes les tables :
--    SELECT tablename, rowsecurity 
--    FROM pg_tables 
--    WHERE schemaname = 'public' 
--    AND tablename IN ('shared_courses', 'shared_flashcards', 'shared_course_links');
--    -- rowsecurity doit être 'true' pour toutes
-- ============================================
