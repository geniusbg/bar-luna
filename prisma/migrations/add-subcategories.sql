-- Add subcategories support
-- Add parent_category_id column to categories table

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_category_id UUID;

-- Add foreign key constraint
ALTER TABLE categories
ADD CONSTRAINT categories_parent_category_id_fkey 
FOREIGN KEY (parent_category_id) 
REFERENCES categories(id) 
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS categories_parent_category_id_idx ON categories(parent_category_id);

