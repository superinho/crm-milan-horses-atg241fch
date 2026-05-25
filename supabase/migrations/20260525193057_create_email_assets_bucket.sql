DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('email-assets', 'email-assets', true) 
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'email-assets');

DROP POLICY IF EXISTS "Authenticated users can upload email assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload email assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'email-assets');

DROP POLICY IF EXISTS "Authenticated users can update email assets" ON storage.objects;
CREATE POLICY "Authenticated users can update email assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'email-assets');

DROP POLICY IF EXISTS "Authenticated users can delete email assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete email assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'email-assets');
