-- Append-only ethics audit trail (IRB / GDPR accountability).
-- Written by server routes using the service role key.

CREATE TABLE IF NOT EXISTS ethics_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  session_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ethics_audit_created ON ethics_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ethics_audit_type ON ethics_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ethics_audit_session ON ethics_audit_events(session_id);

ALTER TABLE ethics_audit_events ENABLE ROW LEVEL SECURITY;

-- No anonymous access; only service role (bypasses RLS) should touch this table in production.
DROP POLICY IF EXISTS "block public ethics_audit" ON ethics_audit_events;
CREATE POLICY "block public ethics_audit" ON ethics_audit_events FOR ALL USING (false);
