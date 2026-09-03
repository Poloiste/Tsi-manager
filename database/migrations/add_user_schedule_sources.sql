-- Description: Store each user's personal ICS schedule URL

CREATE TABLE IF NOT EXISTS public.user_schedule_sources (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ics_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.touch_user_schedule_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_schedule_sources_updated_at ON public.user_schedule_sources;
CREATE TRIGGER trg_user_schedule_sources_updated_at
  BEFORE UPDATE ON public.user_schedule_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_user_schedule_sources_updated_at();

ALTER TABLE public.user_schedule_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own schedule source" ON public.user_schedule_sources;
CREATE POLICY "Users read own schedule source"
  ON public.user_schedule_sources
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own schedule source" ON public.user_schedule_sources;
CREATE POLICY "Users insert own schedule source"
  ON public.user_schedule_sources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own schedule source" ON public.user_schedule_sources;
CREATE POLICY "Users update own schedule source"
  ON public.user_schedule_sources
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
