-- Supabase Advisor security fixes:
-- 1) Enable RLS on research_assessments
-- 2) Ensure no broad public SELECT policy on research_assessments
-- 3) Recreate views with SECURITY INVOKER semantics

ALTER TABLE public.research_assessments ENABLE ROW LEVEL SECURITY;

-- Preserve write path for app collection, but avoid open read exposure.
DROP POLICY IF EXISTS "Allow anonymous insert research_assessments" ON public.research_assessments;
CREATE POLICY "Allow anonymous insert research_assessments"
ON public.research_assessments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Explicitly remove any legacy broad read policy if present.
DROP POLICY IF EXISTS "Allow read access for research_assessments" ON public.research_assessments;
DROP POLICY IF EXISTS "Allow read access for research" ON public.research_assessments;

-- Recreate with security_invoker to satisfy advisor and avoid accidental definer escalation.
CREATE OR REPLACE VIEW public.research_analytics
WITH (security_invoker = true) AS
SELECT
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT p.id) AS completed_profiles,
  COUNT(DISTINCT CASE WHEN s.completion_status = 'completed' THEN s.id END) AS completion_rate_sessions,
  AVG(p.completion_time_seconds) AS avg_completion_time_seconds,
  AVG(p.response_count) AS avg_response_count,
  s.cultural_context,
  DATE_TRUNC('day', s.created_at) AS date
FROM public.sessions s
LEFT JOIN public.profiles p ON s.id = p.session_id
GROUP BY s.cultural_context, DATE_TRUNC('day', s.created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW public.responses
WITH (security_invoker = true) AS
SELECT
  id,
  session_id,
  question_id,
  response,
  response_time_ms,
  question_category,
  dimension_weights,
  created_at
FROM public.question_responses;
