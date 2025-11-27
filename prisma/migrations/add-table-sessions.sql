CREATE TABLE IF NOT EXISTS table_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  table_number INTEGER NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS table_sessions_table_number_idx
  ON table_sessions (table_number);

