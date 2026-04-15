-- Ethics / GDPR support tables (used by src/lib/ethics-service.ts)
-- Apply after supabase-schema.sql

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS session_identifier TEXT,
  ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_session_identifier ON sessions(session_identifier);

CREATE TABLE IF NOT EXISTS data_processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  processing_purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  data_categories JSONB NOT NULL,
  retention_period_months INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  session_identifier TEXT,
  request_data JSONB NOT NULL,
  request_status TEXT NOT NULL DEFAULT 'processing',
  response_data JSONB,
  processed_at TIMESTAMPTZ,
  processed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT NOT NULL,
  new_values JSONB NOT NULL,
  change_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE data_processing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert data_processing" ON data_processing_records;
CREATE POLICY "Allow anonymous insert data_processing" ON data_processing_records
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous insert data_subject" ON data_subject_requests;
CREATE POLICY "Allow anonymous insert data_subject" ON data_subject_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous insert audit" ON audit_log;
CREATE POLICY "Allow anonymous insert audit" ON audit_log
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service read data_subject" ON data_subject_requests;
CREATE POLICY "Allow service read data_subject" ON data_subject_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service update data_subject" ON data_subject_requests;
CREATE POLICY "Allow service update data_subject" ON data_subject_requests
  FOR UPDATE USING (true);
