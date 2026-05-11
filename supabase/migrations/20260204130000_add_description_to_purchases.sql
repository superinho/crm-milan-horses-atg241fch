-- Add description column to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS description TEXT;
