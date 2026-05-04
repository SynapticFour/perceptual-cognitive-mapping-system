-- ATLAS tables — apply after base PCMS schema (`sessions` must exist for FK).
-- Mirrors `supabase/supabase-schema-atlas.sql` for versioned deploys.
-- Inserts from the Next.js API use the service role client (bypasses RLS).

CREATE TABLE IF NOT EXISTS atlas_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locale TEXT NOT NULL,
  question_bank_id TEXT NOT NULL,
  bank_version TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  dimension_scores JSONB,
  imputation_used BOOLEAN DEFAULT FALSE,
  imputation_prior_version TEXT,
  adaptive_summary JSONB,
  session_duration_seconds INTEGER
);

CREATE TABLE IF NOT EXISTS atlas_self_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locale TEXT NOT NULL,
  selected_descriptor_ids TEXT[] NOT NULL,
  linked_pcms_session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
  linked_atlas_session_id UUID REFERENCES atlas_sessions (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS atlas_descriptors (
  id TEXT PRIMARY KEY,
  meta_trait TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_de TEXT,
  text_tw TEXT,
  text_wo TEXT,
  related_pcms_dimensions TEXT[],
  related_atlas_traits TEXT[],
  clinical_equivalent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atlas_sessions_anonymous_id ON atlas_sessions (anonymous_id);
CREATE INDEX IF NOT EXISTS idx_atlas_sessions_created_at ON atlas_sessions (created_at);
CREATE INDEX IF NOT EXISTS idx_atlas_self_nominations_anonymous_id ON atlas_self_nominations (anonymous_id);
CREATE INDEX IF NOT EXISTS idx_atlas_self_nominations_linked_pcms ON atlas_self_nominations (linked_pcms_session_id);
CREATE INDEX IF NOT EXISTS idx_atlas_self_nominations_linked_atlas ON atlas_self_nominations (linked_atlas_session_id);

COMMENT ON TABLE atlas_sessions IS 'ATLAS instrument sessions; separate from PCMS sessions (ADR-001, ADR-002)';
COMMENT ON TABLE atlas_self_nominations IS 'Auxiliary self-nomination selections; not used in scoring (ADR-003)';
COMMENT ON TABLE atlas_descriptors IS 'Reference descriptor cards for self-nomination; clinical_equivalent is research-only (ADR-005)';

ALTER TABLE atlas_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_self_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_descriptors ENABLE ROW LEVEL SECURITY;

-- RLS is ON with no policies for `anon` / `authenticated`: those roles cannot read or write these tables.
-- The Next.js API uses the Supabase service role for inserts, which bypasses RLS. Add explicit policies only
-- if you introduce direct client access (e.g. optional anon INSERT) after a security review.
