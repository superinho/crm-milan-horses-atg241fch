-- Enable storage if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure email-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS policies for email-assets allow public select
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'email-assets');

-- Allow authenticated users to upload to email-assets
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'email-assets');

-- Allow authenticated users to update their uploads
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
CREATE POLICY "Authenticated Updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'email-assets');

-- Allow authenticated users to delete their uploads
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;
CREATE POLICY "Authenticated Deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'email-assets');
