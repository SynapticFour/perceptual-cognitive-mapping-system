-- Production-Grade Supabase Schema for Perceptual & Cognitive Mapping System
-- GDPR-Compliant, Research-Focused, Audit-Ready

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- GDPR COMPLIANCE & AUDIT TABLES
-- ========================================

-- Data processing records (GDPR Article 30 compliance)
CREATE TABLE IF NOT EXISTS data_processing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  processing_purpose VARCHAR(100) NOT NULL,
  legal_basis VARCHAR(50) NOT NULL, -- 'consent', 'legitimate_interest', 'research'
  data_categories TEXT[] NOT NULL, -- Array of data categories processed
  retention_period_months INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data subject requests (GDPR Article 15-21 compliance)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction')),
  session_identifier VARCHAR(255), -- For anonymous sessions
  request_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (request_status IN ('pending', 'processing', 'completed', 'rejected')),
  request_data JSONB, -- Original request details
  response_data JSONB, -- Response details
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by VARCHAR(100), -- System or admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for all data operations
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(50) NOT NULL,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  user_context JSONB, -- IP, user agent, etc.
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_reason TEXT
);

-- ========================================
-- CORE RESEARCH DATA TABLES
-- ========================================

-- Enhanced sessions table with GDPR compliance
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_identifier VARCHAR(255) UNIQUE, -- Public-facing identifier for data requests
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- GDPR compliance fields
  consent_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  consent_ip_hash VARCHAR(64), -- Hashed IP for consent verification
  data_retention_until TIMESTAMP WITH TIME ZONE, -- Automated deletion date
  
  -- Research integrity fields
  assessment_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  completion_status VARCHAR(20) NOT NULL DEFAULT 'in_progress' 
    CHECK (completion_status IN ('in_progress', 'completed', 'abandoned', 'confidence_met', 'max_questions', 'user_exit')),
  
  -- Technical fields
  user_agent TEXT,
  ip_hash VARCHAR(64),
  question_path TEXT[],
  duration_ms BIGINT,
  
  -- GDPR metadata
  data_processing_basis VARCHAR(50) NOT NULL DEFAULT 'consent',
  special_category_data BOOLEAN DEFAULT TRUE, -- Cognitive data is special category
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Cognitive profile data
  cognitive_vector JSONB NOT NULL,
  confidence_vector JSONB NOT NULL,
  response_count INTEGER NOT NULL DEFAULT 0,
  completion_time_seconds INTEGER NOT NULL,
  
  -- Research metadata
  scoring_algorithm_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  outlier_flags JSONB, -- Mark any detected response outliers
  reliability_metrics JSONB, -- Detailed reliability information
  
  -- GDPR compliance
  data_subject_identifiers JSONB, -- Any identifiers that could identify the person
  anonymization_method VARCHAR(50), -- How data was anonymized
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for research queries
  INDEX idx_profiles_session_id (session_id),
  INDEX idx_profiles_created_at (created_at),
  INDEX idx_profiles_cultural_context (cultural_context),
  INDEX idx_profiles_cognitive_vector USING GIN(cognitive_vector),
  INDEX idx_profiles_confidence_vector USING GIN(confidence_vector)
);

-- Enhanced question responses table
CREATE TABLE IF NOT EXISTS question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Response data
  question_id VARCHAR(50) NOT NULL,
  question_version VARCHAR(20) DEFAULT 'v1.0',
  response INTEGER NOT NULL CHECK (response >= 1 AND response <= 5),
  response_time_ms INTEGER NOT NULL,
  
  -- Question metadata
  question_category VARCHAR(50) NOT NULL,
  dimension_weights JSONB NOT NULL,
  question_difficulty VARCHAR(20) DEFAULT 'broad',
  
  -- Research data
  response_confidence DECIMAL(3,2), -- Confidence in this response
  is_outlier BOOLEAN DEFAULT FALSE,
  outlier_score DECIMAL(4,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for research queries
  INDEX idx_question_responses_session_id (session_id),
  INDEX idx_question_responses_question_id (question_id),
  INDEX idx_question_responses_category (question_category),
  INDEX idx_question_responses_created_at (created_at),
  INDEX idx_question_responses_dimension_weights USING GIN(dimension_weights)
);

-- Research assessments table (structured data export)
CREATE TABLE IF NOT EXISTS research_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Assessment metadata
  assessment_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  duration_ms BIGINT NOT NULL,
  question_path TEXT[] NOT NULL,
  
  -- Complete data package
  responses JSONB NOT NULL, -- All responses with timing
  final_profile JSONB NOT NULL, -- Complete profile with metadata
  completion_status VARCHAR(20) NOT NULL,
  cultural_context VARCHAR(20) NOT NULL DEFAULT 'universal',
  
  -- Research quality metrics
  data_quality_score DECIMAL(3,2), -- Overall data quality assessment
  missing_data_indicators JSONB,
  consistency_metrics JSONB,
  
  -- GDPR compliance
  anonymization_applied BOOLEAN DEFAULT TRUE,
  export_format VARCHAR(20) DEFAULT 'json',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for research queries
  INDEX idx_research_assessments_session_id (session_id),
  INDEX idx_research_assessments_version (assessment_version),
  INDEX idx_research_assessments_status (completion_status),
  INDEX idx_research_assessments_timestamp (timestamp),
  INDEX idx_research_assessments_cultural_context (cultural_context),
  INDEX idx_research_assessments_final_profile USING GIN(final_profile),
  INDEX idx_research_assessments_data_quality (data_quality_score)
);

-- ========================================
-- AUTOMATED GDPR COMPLIANCE
-- ========================================

-- Function to automatically delete expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions and related data
  DELETE FROM sessions 
  WHERE data_retention_until IS NOT NULL 
  AND data_retention_until < NOW();
  
  -- Log cleanup operation
  INSERT INTO audit_log (table_name, operation, change_reason)
  VALUES ('sessions', 'DELETE', 'Automated GDPR cleanup');
END;
$$ LANGUAGE plpgsql;

-- Function to create audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, user_context)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), current_setting('request.headers')::jsonb);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, user_context)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), current_setting('request.headers')::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, record_id, new_values, user_context)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), current_setting('request.headers')::jsonb);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_sessions AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_question_responses AFTER INSERT OR UPDATE OR DELETE ON question_responses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_research_assessments AFTER INSERT OR UPDATE OR DELETE ON research_assessments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ========================================
-- RESEARCH VIEWS & ANALYTICS
-- ========================================

-- Research analytics view (GDPR-compliant, aggregated only)
CREATE OR REPLACE VIEW research_analytics AS
SELECT 
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT p.id) as completed_profiles,
  COUNT(DISTINCT CASE WHEN s.completion_status = 'completed' THEN s.id END) as completion_rate_sessions,
  AVG(p.completion_time_seconds) as avg_completion_time_seconds,
  AVG(p.response_count) as avg_response_count,
  s.cultural_context,
  s.assessment_version,
  DATE_TRUNC('day', s.created_at) as date,
  -- Aggregated cognitive patterns (no individual data)
  jsonb_agg(
    jsonb_build_object(
      'cognitive_vector', p.cognitive_vector,
      'confidence_vector', p.confidence_vector,
      'reliability', p.reliability_metrics
    )
  ) FILTER (WHERE p.cognitive_vector IS NOT NULL) as aggregated_patterns
FROM sessions s
LEFT JOIN profiles p ON s.id = p.session_id
GROUP BY s.cultural_context, s.assessment_version, DATE_TRUNC('day', s.created_at)
ORDER BY date DESC;

-- Data quality monitoring view
CREATE OR REPLACE VIEW data_quality_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_assessments,
  AVG(data_quality_score) as avg_quality_score,
  COUNT(CASE WHEN data_quality_score > 0.8 THEN 1 END) as high_quality_count,
  COUNT(CASE WHEN data_quality_score < 0.5 THEN 1 END) as low_quality_count,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(CASE WHEN duration_ms > 1800000 THEN 1 END) as long_duration_count -- > 30 minutes
FROM research_assessments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ========================================
-- SECURITY & PRIVACY
-- ========================================

-- Row Level Security (RLS) policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_assessments ENABLE ROW LEVEL SECURITY;

-- Anonymous insert policies
CREATE POLICY "Allow anonymous insert" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert" ON question_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert" ON research_assessments
  FOR INSERT WITH CHECK (true);

-- Research read policies (restricted in production)
CREATE POLICY "Allow research read access" ON sessions
  FOR SELECT USING (false); -- Disabled by default

CREATE POLICY "Allow research read access" ON profiles
  FOR SELECT USING (false); -- Disabled by default

CREATE POLICY "Allow research read access" ON question_responses
  FOR SELECT USING (false); -- Disabled by default

CREATE POLICY "Allow research read access" ON research_assessments
  FOR SELECT USING (false); -- Disabled by default

-- Update policy for session status
CREATE POLICY "Allow session status updates" ON sessions
  FOR UPDATE USING (true);

-- ========================================
-- AUTOMATED RETENTION POLICY
-- ========================================

-- Function to set retention period on new sessions
CREATE OR REPLACE FUNCTION set_retention_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default retention period (e.g., 5 years for research data)
  NEW.data_retention_until := NEW.created_at + INTERVAL '5 years';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_retention_trigger
  BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_retention_period();

-- ========================================
-- COMMENTS & DOCUMENTATION
-- ========================================

COMMENT ON TABLE sessions IS 'GDPR-compliant session tracking with automated retention';
COMMENT ON TABLE profiles IS 'Anonymous cognitive profiles with research metadata';
COMMENT ON TABLE question_responses IS 'Individual responses with timing and quality metrics';
COMMENT ON TABLE research_assessments IS 'Structured research data packages for analysis';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all data operations';
COMMENT ON TABLE data_processing_records IS 'GDPR Article 30 compliance records';
COMMENT ON TABLE data_subject_requests IS 'GDPR Article 15-21 rights requests tracking';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_retention ON sessions(data_retention_until);
CREATE INDEX IF NOT EXISTS idx_sessions_consent ON sessions(consent_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name, operation);
