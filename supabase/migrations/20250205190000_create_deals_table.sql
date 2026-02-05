-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    stage TEXT NOT NULL,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    probability NUMERIC(5, 2) DEFAULT 0,
    expected_close_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated full access deals" ON deals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON deals
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Seed data for deals
DO $$
DECLARE
    contact_roberto UUID;
    contact_haras UUID;
    contact_fernanda UUID;
    contact_juliana UUID;
BEGIN
    SELECT id INTO contact_roberto FROM contacts WHERE name = 'Roberto Almeida' LIMIT 1;
    SELECT id INTO contact_haras FROM contacts WHERE name = 'Haras Pôr do Sol' LIMIT 1;
    SELECT id INTO contact_fernanda FROM contacts WHERE name = 'Fernanda Lima' LIMIT 1;
    SELECT id INTO contact_juliana FROM contacts WHERE name = 'Juliana Paes' LIMIT 1;

    IF contact_roberto IS NOT NULL THEN
        INSERT INTO deals (contact_id, title, stage, value, probability, expected_close_date)
        VALUES (contact_roberto, 'Lote 15 - Cavalo Lusitano', 'Proposta', 150000, 70, NOW() + INTERVAL '15 days');
    END IF;

    IF contact_haras IS NOT NULL THEN
        INSERT INTO deals (contact_id, title, stage, value, probability, expected_close_date)
        VALUES (contact_haras, 'Lote 03 - Potro Manga Larga', 'Qualificado', 45000, 40, NOW() + INTERVAL '30 days');
    END IF;

    IF contact_fernanda IS NOT NULL THEN
        INSERT INTO deals (contact_id, title, stage, value, probability, expected_close_date)
        VALUES (contact_fernanda, 'Lote 22 - Égua Crioula', 'Interesse', 85000, 60, NOW() + INTERVAL '20 days');
    END IF;

    IF contact_juliana IS NOT NULL THEN
        INSERT INTO deals (contact_id, title, stage, value, probability, expected_close_date)
        VALUES (contact_juliana, 'Lote 10 - Garanhão Árabe', 'Lead', 450000, 20, NOW() + INTERVAL '45 days');
    END IF;

    IF contact_roberto IS NOT NULL THEN
        INSERT INTO deals (contact_id, title, stage, value, probability, expected_close_date)
        VALUES (contact_roberto, 'Consultoria Genética', 'Fechado', 15000, 100, NOW() - INTERVAL '5 days');
    END IF;
END $$;
