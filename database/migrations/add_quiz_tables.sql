-- =========================================
-- Quiz/Exam Mode - Database Tables
-- =========================================

-- Quiz Sessions
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT NOT NULL, -- 'training', 'exam', 'preparation'
  question_count INTEGER NOT NULL,
  time_limit_minutes INTEGER, -- NULL = no limit
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Answers (individual question responses)
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES public.shared_flashcards(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created ON public.quiz_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON public.quiz_answers(quiz_session_id);

-- Row Level Security
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Quiz Sessions Policies
DROP POLICY IF EXISTS "Users see only their quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Users see only their quiz sessions" ON public.quiz_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Quiz Answers Policies
DROP POLICY IF EXISTS "Users see only their quiz answers" ON public.quiz_answers;
CREATE POLICY "Users see only their quiz answers" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE quiz_sessions.id = quiz_answers.quiz_session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );
