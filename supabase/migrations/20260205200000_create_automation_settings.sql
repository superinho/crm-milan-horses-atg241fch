CREATE TABLE IF NOT EXISTS automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON automation_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update access for authenticated users" ON automation_settings
    FOR UPDATE TO authenticated USING (true);

-- Seed Data
INSERT INTO automation_settings (rule_key, name, description, is_active) VALUES
('birthday', 'Aniversário do Cliente', 'Gera tarefa 1 dia antes do aniversário.', true),
('post_sale', 'Follow-up Pós-venda', 'Gera tarefas 7, 30 e 60 dias após compra.', true),
('inactivity', 'Alerta de Inatividade', 'Gera tarefa após 90 dias sem lances.', true),
('lost_bid', 'Follow-up de Lances', 'Gera tarefa 3 dias após lance não ganho.', true)
ON CONFLICT (rule_key) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Note: To schedule the edge function, one would typically use pg_cron extension if enabled or Supabase Dashboard.
-- Example for pg_cron (if extension is available and user has permissions):
-- SELECT cron.schedule(
--   'process-automation-tasks-daily',
--   '0 0 * * *', 
--   $$
--   select
--     net.http_post(
--         url:='https://<PROJECT_REF>.supabase.co/functions/v1/process-automation-tasks',
--         headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
--     ) as request_id;
--   $$
-- );
