-- Add metadata column to message_templates to store rich media and banner properties
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
