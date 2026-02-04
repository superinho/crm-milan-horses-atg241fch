-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    auction_id TEXT,
    lot_number TEXT,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow authenticated full access bids" ON bids FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Data for Bids
DO $$
DECLARE
    contact_roberto UUID;
    contact_fernanda UUID;
    contact_haras UUID;
    contact_juliana UUID;
BEGIN
    SELECT id INTO contact_roberto FROM contacts WHERE email = 'roberto@fazendaalmeida.com';
    SELECT id INTO contact_fernanda FROM contacts WHERE email = 'fernanda.lima@email.com';
    SELECT id INTO contact_haras FROM contacts WHERE email = 'contato@haraspordosol.com.br';
    SELECT id INTO contact_juliana FROM contacts WHERE email = 'ju.paes@invest.com';

    IF contact_roberto IS NOT NULL THEN
        INSERT INTO bids (contact_id, auction_id, lot_number, value, date, reason) VALUES
        (contact_roberto, 'Leilão Elite 2025', 'Lote 45', 120000, CURRENT_DATE - INTERVAL '15 days', 'Superado por outro comprador'),
        (contact_roberto, 'Leilão Quarter Horse', 'Lote 12', 90000, CURRENT_DATE - INTERVAL '60 days', 'Desistência');
    END IF;

    IF contact_fernanda IS NOT NULL THEN
        INSERT INTO bids (contact_id, auction_id, lot_number, value, date, reason) VALUES
        (contact_fernanda, 'Leilão Mangalarga', 'Lote 05', 45000, CURRENT_DATE - INTERVAL '5 days', 'Superado por outro comprador');
    END IF;

    IF contact_haras IS NOT NULL THEN
        INSERT INTO bids (contact_id, auction_id, lot_number, value, date, reason) VALUES
        (contact_haras, 'Leilão Internacional', 'Lote 99', 400000, CURRENT_DATE - INTERVAL '45 days', 'Valor acima do limite'),
        (contact_haras, 'Leilão Potros do Futuro', 'Lote 22', 250000, CURRENT_DATE - INTERVAL '10 days', 'Superado por outro comprador');
    END IF;

    IF contact_juliana IS NOT NULL THEN
        INSERT INTO bids (contact_id, auction_id, lot_number, value, date, reason) VALUES
        (contact_juliana, 'Leilão Virtual de Embriões', 'Lote 03', 35000, CURRENT_DATE - INTERVAL '2 days', 'Desistência');
    END IF;
END $$;
