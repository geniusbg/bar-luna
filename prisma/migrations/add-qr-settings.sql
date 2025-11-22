-- Create QR code settings table
CREATE TABLE IF NOT EXISTS qr_code_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_qr_code_settings_updated_at ON qr_code_settings(updated_at DESC);

