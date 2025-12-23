-- Add QR scan history table
CREATE TABLE IF NOT EXISTS qr_scans (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES bar_tables(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qr_scans_table_id ON qr_scans(table_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_table_number ON qr_scans(table_number);


