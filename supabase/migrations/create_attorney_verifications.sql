-- Attorney Verifications Table
-- Audit trail for all attorney data verifications
-- CRITICAL: NO attorney outreach without verification record

CREATE TABLE IF NOT EXISTS attorney_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  verified BOOLEAN NOT NULL DEFAULT false,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  issues TEXT,  -- Pipe-separated list of blocking issues
  warnings TEXT,  -- Pipe-separated list of non-blocking warnings
  audit_trail TEXT NOT NULL,  -- Full audit log of verification process
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  verified_by TEXT NOT NULL DEFAULT 'system',  -- 'system', 'jordan', 'atlas', or 'manual'

  -- Indexes for performance
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_attorney_verifications_attorney_id ON attorney_verifications(attorney_id);
CREATE INDEX IF NOT EXISTS idx_attorney_verifications_verified ON attorney_verifications(verified);
CREATE INDEX IF NOT EXISTS idx_attorney_verifications_verified_at ON attorney_verifications(verified_at DESC);

-- Ensure we can quickly find latest verification for an attorney
CREATE INDEX IF NOT EXISTS idx_attorney_verifications_latest
  ON attorney_verifications(attorney_id, verified_at DESC);

COMMENT ON TABLE attorney_verifications IS 'Audit trail for attorney data verification. Every attorney must be verified by Jordan and Atlas before outreach.';
COMMENT ON COLUMN attorney_verifications.verified IS 'TRUE if attorney passed all critical checks (email, name, source, Jordan, Atlas)';
COMMENT ON COLUMN attorney_verifications.confidence_score IS 'Confidence score 0-100 based on verification checks passed';
COMMENT ON COLUMN attorney_verifications.issues IS 'Blocking issues that prevent outreach';
COMMENT ON COLUMN attorney_verifications.warnings IS 'Non-blocking concerns logged for review';
COMMENT ON COLUMN attorney_verifications.audit_trail IS 'Complete log of all verification steps and results';
