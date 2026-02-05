-- Add notes to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add deal_id to contact_interactions
ALTER TABLE contact_interactions ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;

-- Create deal_tasks table
CREATE TABLE IF NOT EXISTS deal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for deal_tasks
ALTER TABLE deal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access deal_tasks" ON deal_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to create default tasks
CREATE OR REPLACE FUNCTION create_default_deal_tasks()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deal_tasks (deal_id, description) VALUES
    (NEW.id, 'Enviar catálogo'),
    (NEW.id, 'Agendar ligação'),
    (NEW.id, 'Enviar vídeo do cavalo'),
    (NEW.id, 'Follow-up');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for new deals
CREATE TRIGGER trigger_create_default_deal_tasks
AFTER INSERT ON deals
FOR EACH ROW
EXECUTE PROCEDURE create_default_deal_tasks();

-- Backfill existing deals with tasks if they don't have any
DO $$
DECLARE
    deal_record RECORD;
BEGIN
    FOR deal_record IN SELECT id FROM deals LOOP
        IF NOT EXISTS (SELECT 1 FROM deal_tasks WHERE deal_id = deal_record.id) THEN
            INSERT INTO deal_tasks (deal_id, description) VALUES
            (deal_record.id, 'Enviar catálogo'),
            (deal_record.id, 'Agendar ligação'),
            (deal_record.id, 'Enviar vídeo do cavalo'),
            (deal_record.id, 'Follow-up');
        END IF;
    END LOOP;
END $$;
