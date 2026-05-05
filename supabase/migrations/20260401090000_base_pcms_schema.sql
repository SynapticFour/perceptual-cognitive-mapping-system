-- Base PCMS schema migration for fresh Supabase projects.
-- This intentionally mirrors `supabase-schema.sql` so `supabase db push`
-- works without manual SQL editor bootstrap.

-- Enable UUID helpers used by the schema and follow-up migrations.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sessions table - tracks assessment sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  user_agent TEXT,
  ip_hash VARCHAR(64), -- Hashed IP for basic rate limiting
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (completion_status IN ('in_progress', 'completed', 'abandoned', 'confidence_met', 'max_questions', 'user_exit')),

  -- RESEARCH-GRADE: Additional fields for research integrity
  assessment_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  question_path TEXT[], -- Array of question IDs in order asked
  duration_ms BIGINT, -- Total assessment duration in milliseconds

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table - stores final cognitive profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  cognitive_vector JSONB NOT NULL, -- {F: number, P: number, S: number, E: number, R: number, C: number}
  confidence_vector JSONB NOT NULL, -- Confidence values for each dimension
  response_count INTEGER NOT NULL DEFAULT 0,
  completion_time_seconds INTEGER NOT NULL,
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question responses table - stores individual question responses
CREATE TABLE IF NOT EXISTS question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL,
  response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5), -- Likert scale
  response_time_ms INTEGER NOT NULL,
  question_category VARCHAR(50) NOT NULL,
  dimension_weights JSONB NOT NULL, -- Weights for each cognitive dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research analytics view
CREATE OR REPLACE VIEW research_analytics AS
SELECT
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT p.id) as completed_profiles,
  COUNT(DISTINCT CASE WHEN s.completion_status = 'completed' THEN s.id END) as completion_rate_sessions,
  AVG(p.completion_time_seconds) as avg_completion_time_seconds,
  AVG(p.response_count) as avg_response_count,
  s.cultural_context,
  DATE_TRUNC('day', s.created_at) as date
FROM sessions s
LEFT JOIN profiles p ON s.id = p.session_id
GROUP BY s.cultural_context, DATE_TRUNC('day', s.created_at)
ORDER BY date DESC;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for data collection)
DROP POLICY IF EXISTS "Allow anonymous insert" ON sessions;
CREATE POLICY "Allow anonymous insert" ON sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous insert" ON profiles;
CREATE POLICY "Allow anonymous insert" ON profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous insert" ON question_responses;
CREATE POLICY "Allow anonymous insert" ON question_responses
  FOR INSERT WITH CHECK (true);

-- Policy: Allow read access for research (in production, this would be more restricted)
DROP POLICY IF EXISTS "Allow read access for research" ON sessions;
CREATE POLICY "Allow read access for research" ON sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for research" ON profiles;
CREATE POLICY "Allow read access for research" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for research" ON question_responses;
CREATE POLICY "Allow read access for research" ON question_responses
  FOR SELECT USING (true);

-- Policy: Allow updates for session status (for abandonment tracking)
DROP POLICY IF EXISTS "Allow session status updates" ON sessions;
CREATE POLICY "Allow session status updates" ON sessions
  FOR UPDATE USING (true);

-- RESEARCH-GRADE: Research assessments table for structured data
CREATE TABLE IF NOT EXISTS research_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  assessment_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_ms BIGINT NOT NULL,
  question_path TEXT[] NOT NULL,
  responses JSONB NOT NULL, -- Array of response objects with timing
  final_profile JSONB NOT NULL, -- Complete profile with vector and confidence
  completion_status VARCHAR(20) NOT NULL
    CHECK (completion_status IN ('confidence_met', 'max_questions', 'user_exit')),
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE sessions IS 'Tracks assessment sessions with anonymous user data';
COMMENT ON TABLE profiles IS 'Stores final cognitive profiles with dimensional vectors';
COMMENT ON TABLE question_responses IS 'Individual question responses with timing data';
COMMENT ON TABLE research_assessments IS 'Structured research-grade assessment data with complete tracking';
COMMENT ON VIEW research_analytics IS 'Aggregated analytics for research purposes';

-- Indexes for performance (PostgreSQL: define outside CREATE TABLE)
CREATE INDEX IF NOT EXISTS idx_sessions_cultural_context ON sessions(cultural_context);
CREATE INDEX IF NOT EXISTS idx_sessions_completion_status ON sessions(completion_status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_cultural_context ON profiles(cultural_context);
CREATE INDEX IF NOT EXISTS idx_profiles_cognitive_vector ON profiles USING GIN(cognitive_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_confidence_vector ON profiles USING GIN(confidence_vector);

CREATE INDEX IF NOT EXISTS idx_question_responses_session_id ON question_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_question_id ON question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_category ON question_responses(question_category);
CREATE INDEX IF NOT EXISTS idx_question_responses_created_at ON question_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_question_responses_dimension_weights ON question_responses USING GIN(dimension_weights);

CREATE INDEX IF NOT EXISTS idx_research_assessments_session_id ON research_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_research_assessments_version ON research_assessments(assessment_version);
CREATE INDEX IF NOT EXISTS idx_research_assessments_status ON research_assessments(completion_status);
CREATE INDEX IF NOT EXISTS idx_research_assessments_timestamp ON research_assessments(timestamp);
CREATE INDEX IF NOT EXISTS idx_research_assessments_cultural_context ON research_assessments(cultural_context);
CREATE INDEX IF NOT EXISTS idx_research_assessments_final_profile ON research_assessments USING GIN(final_profile);
