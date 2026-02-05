-- Add status and metadata columns to contact_interactions for email tracking
ALTER TABLE contact_interactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE contact_interactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
