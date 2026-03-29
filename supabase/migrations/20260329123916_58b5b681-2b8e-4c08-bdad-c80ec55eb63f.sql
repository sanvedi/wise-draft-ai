
CREATE TABLE public.content_learnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  post_count INTEGER NOT NULL DEFAULT 0,
  platforms_analyzed TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learnings" ON public.content_learnings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learnings" ON public.content_learnings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own learnings" ON public.content_learnings FOR DELETE TO authenticated USING (auth.uid() = user_id);
