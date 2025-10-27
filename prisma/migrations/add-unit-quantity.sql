-- Add unit and quantity fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

