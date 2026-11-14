-- Restore secret for one person's own saved answers, and close anonymous reads.
-- The application stores only the SHA-256 hash. The secret stays with the person.
-- Service role (server routes) may set the hash. The anon key may not read session rows.

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS restore_secret_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_restore_secret_hash
  ON sessions (restore_secret_hash)
  WHERE restore_secret_hash IS NOT NULL;

COMMENT ON COLUMN sessions.restore_secret_hash IS
  'SHA-256 hex of the person''s restore secret. The secret is not stored.';

CREATE OR REPLACE FUNCTION public.pcms_guard_restore_secret_hash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.restore_secret_hash := NULL;
  ELSE
    NEW.restore_secret_hash := OLD.restore_secret_hash;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pcms_guard_restore_secret_hash ON sessions;
CREATE TRIGGER pcms_guard_restore_secret_hash
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION public.pcms_guard_restore_secret_hash();

-- Repeat the hardening drops so a project that re-applied the base schema
-- does not leave a public SELECT on participant rows.
DROP POLICY IF EXISTS "Allow read access for research" ON sessions;
DROP POLICY IF EXISTS "Allow read access for research" ON profiles;
DROP POLICY IF EXISTS "Allow read access for research" ON question_responses;
DROP POLICY IF EXISTS "Allow read access for research" ON research_assessments;
DROP POLICY IF EXISTS "Allow read access for research_assessments" ON research_assessments;

-- This policy was FOR SELECT USING (true) with no role limit, so the anon key could read every request.
DROP POLICY IF EXISTS "Allow service read data_subject" ON data_subject_requests;
DROP POLICY IF EXISTS "Allow service update data_subject" ON data_subject_requests;

-- Table GRANTs are left in place. With RLS on and no SELECT policy, the anon key
-- receives an empty set (the keep-alive probe stays HTTP 200) and no session row.
