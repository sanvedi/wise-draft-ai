
CREATE TABLE public.pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  prompt text NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  brand_dna jsonb,
  media_descriptions text[] DEFAULT '{}',
  current_step text NOT NULL DEFAULT 'drafter',
  checkpoints jsonb NOT NULL DEFAULT '{}',
  result jsonb,
  error_log jsonb DEFAULT '[]',
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipeline runs"
  ON public.pipeline_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipeline runs"
  ON public.pipeline_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline runs"
  ON public.pipeline_runs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_runs;
