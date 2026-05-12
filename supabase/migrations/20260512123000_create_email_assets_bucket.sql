-- Public bucket for email-safe banners and editorial images used by the Message Studio.

INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Email assets are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

CREATE POLICY "Authenticated users can manage email assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'email-assets')
WITH CHECK (bucket_id = 'email-assets');
