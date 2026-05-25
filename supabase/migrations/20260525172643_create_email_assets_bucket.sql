DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('email-assets', 'email-assets', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "public_read_email_assets" ON storage.objects;
CREATE POLICY "public_read_email_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'email-assets');

DROP POLICY IF EXISTS "auth_insert_email_assets" ON storage.objects;
CREATE POLICY "auth_insert_email_assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'email-assets');
