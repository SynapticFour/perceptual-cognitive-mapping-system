-- Harden public-read exposure and add research-grade normalized session storage.
-- Keeps backward compatibility with existing PCMS writes.

-- 1) Remove broad public SELECT access on participant-derived tables.
DROP POLICY IF EXISTS "Allow read access for research" ON sessions;
DROP POLICY IF EXISTS "Allow read access for research" ON profiles;
DROP POLICY IF EXISTS "Allow read access for research" ON question_responses;

-- 2) Add normalized research-grade pipeline session table.
CREATE TABLE IF NOT EXISTS pipeline_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  pipeline_storage_version INTEGER NOT NULL,
  assessment_version TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  trait_vector JSONB NOT NULL,
  confidence JSONB NOT NULL,
  contradiction JSONB,
  question_bank_id TEXT,
  bank_version TEXT,
  adaptive_mode TEXT CHECK (adaptive_mode IN ('routing_coverage', 'profile_diagnostic')),
  region_info TEXT,
  response_count INTEGER NOT NULL,
  revision INTEGER,
  final_profile JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_sessions_session_id ON pipeline_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_sessions_completed_at ON pipeline_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_sessions_assessment_version ON pipeline_sessions(assessment_version);
CREATE INDEX IF NOT EXISTS idx_pipeline_sessions_question_bank_id ON pipeline_sessions(question_bank_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_sessions_adaptive_mode ON pipeline_sessions(adaptive_mode);
CREATE INDEX IF NOT EXISTS idx_pipeline_sessions_region_info ON pipeline_sessions(region_info);

ALTER TABLE pipeline_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert pipeline_sessions" ON pipeline_sessions;
CREATE POLICY "Allow anonymous insert pipeline_sessions" ON pipeline_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow session pipeline upsert" ON pipeline_sessions;
CREATE POLICY "Allow session pipeline upsert" ON pipeline_sessions
  FOR UPDATE USING (true);

DROP TRIGGER IF EXISTS update_pipeline_sessions_updated_at ON pipeline_sessions;
CREATE TRIGGER update_pipeline_sessions_updated_at
  BEFORE UPDATE ON pipeline_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE pipeline_sessions IS 'Normalized full pipeline/session payloads for research-grade export and longitudinal analysis';
COMMENT ON COLUMN pipeline_sessions.trait_vector IS 'StoredPipelineSession.embedding/vector snapshot used for trait-space analysis';
COMMENT ON COLUMN pipeline_sessions.confidence IS 'Confidence payload (interpretation/embedding/highlights)';
COMMENT ON COLUMN pipeline_sessions.contradiction IS 'Profile-diagnostic contradiction summary and optional by-dimension details';
COMMENT ON COLUMN pipeline_sessions.region_info IS 'Stem region or deployment region info captured at completion time';

-- 3) Compatibility facade for integrations expecting `responses`.
CREATE OR REPLACE VIEW responses AS
SELECT
  id,
  session_id,
  question_id,
  response,
  response_time_ms,
  question_category,
  dimension_weights,
  created_at
FROM question_responses;

COMMENT ON VIEW responses IS 'Backward-compatible alias for question_responses';
