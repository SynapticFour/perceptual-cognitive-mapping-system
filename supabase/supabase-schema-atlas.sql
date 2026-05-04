-- ATLAS tables — apply after supabase-schema.sql (PCMS `sessions` must exist).
-- Does not alter PCMS tables. Prefer the versioned file
-- `supabase/migrations/20260502120000_atlas_tables_rls.sql` for new Supabase projects (includes RLS).

-- ATLAS sessions (separate from PCMS sessions)
CREATE TABLE IF NOT EXISTS atlas_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID NOT NULL, -- same anonymous_id as pcms_sessions if linked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locale TEXT NOT NULL,
  question_bank_id TEXT NOT NULL, -- e.g. "atlas-v1"
  bank_version TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,

  -- Scores
  dimension_scores JSONB, -- Array of DimensionScore (see src/types/shared.ts)
  imputation_used BOOLEAN DEFAULT FALSE,
  imputation_prior_version TEXT, -- e.g. "atlas-v1-en-20250101"

  -- Research metadata
  adaptive_summary JSONB,
  session_duration_seconds INTEGER
);

-- ATLAS self-nomination responses (completely separate table)
CREATE TABLE IF NOT EXISTS atlas_self_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locale TEXT NOT NULL,

  -- Selected descriptor IDs (not the text — text can change)
  selected_descriptor_ids TEXT[] NOT NULL,

  -- Optional: linked PCMS session for convergent validity research
  linked_pcms_session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
  -- Optional: linked ATLAS session
  linked_atlas_session_id UUID REFERENCES atlas_sessions (id) ON DELETE SET NULL
);

-- ATLAS descriptor library (the card content)
-- This is reference data, not user data
CREATE TABLE IF NOT EXISTS atlas_descriptors (
  id TEXT PRIMARY KEY, -- e.g. "DESC-intero-001"
  meta_trait TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_de TEXT,
  text_tw TEXT,
  text_wo TEXT,
  related_pcms_dimensions TEXT[], -- e.g. ["S", "C"]
  related_atlas_traits TEXT[], -- e.g. ["MT-intero-001"]
  clinical_equivalent TEXT, -- Internal research reference ONLY — never shown in UI (ADR-005)
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
