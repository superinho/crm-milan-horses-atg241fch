-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.message_templates;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.message_templates;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.message_templates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.message_templates;

-- Create policies
CREATE POLICY "Enable delete access for authenticated users" ON public.message_templates
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.message_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON public.message_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update access for authenticated users" ON public.message_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
