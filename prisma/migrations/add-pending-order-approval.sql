-- Create pending_order_approvals table
CREATE TABLE IF NOT EXISTS pending_order_approvals (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  table_number INTEGER NOT NULL,
  order_count INTEGER NOT NULL,
  reason TEXT DEFAULT 'rate_limit_exceeded',
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status_requested 
ON pending_order_approvals(status, requested_at);

