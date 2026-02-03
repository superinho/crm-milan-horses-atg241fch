-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    birth_date DATE,
    cpf TEXT,
    address TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    origin TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- References auth.users(id) conceptually
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    auction_id TEXT,
    lot_number TEXT,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT 'bg-primary text-primary-foreground'
);

CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all authenticated users to read/write for now to simulate internal CRM)
CREATE POLICY "Allow authenticated full access contacts" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access companies" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access interactions" ON contact_interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access purchases" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access tags" ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access contact_tags" ON contact_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Data

-- Tags
INSERT INTO tags (name, color) VALUES
('VIP', 'bg-secondary text-secondary-foreground hover:bg-secondary/80'),
('Frequente', 'bg-blue-500 text-white hover:bg-blue-600'),
('Ativo', 'bg-green-600 text-white hover:bg-green-700'),
('Inativo', 'bg-gray-500 text-white hover:bg-gray-600'),
('Novo Lead', 'bg-primary text-primary-foreground hover:bg-primary/90')
ON CONFLICT (name) DO NOTHING;

-- Contacts (Inserting ~20 contacts)
DO $$
DECLARE
    tag_vip UUID;
    tag_freq UUID;
    tag_ativo UUID;
    tag_inativo UUID;
    tag_novo UUID;
    contact_id UUID;
BEGIN
    SELECT id INTO tag_vip FROM tags WHERE name = 'VIP';
    SELECT id INTO tag_freq FROM tags WHERE name = 'Frequente';
    SELECT id INTO tag_ativo FROM tags WHERE name = 'Ativo';
    SELECT id INTO tag_inativo FROM tags WHERE name = 'Inativo';
    SELECT id INTO tag_novo FROM tags WHERE name = 'Novo Lead';

    -- 1. Roberto Almeida
    INSERT INTO contacts (name, email, phone, whatsapp, birth_date, cpf, address, preferences, origin, notes)
    VALUES ('Roberto Almeida', 'roberto@fazendaalmeida.com', '(11) 99876-5432', '(11) 99876-5432', '1980-05-15', '123.456.789-00', 'Av. Brasil, 1500', '{"breeds": ["Lusitano"], "modalities": ["Adestramento"], "valueRange": "R$ 100k - R$ 300k"}'::jsonb, 'Indicação Profissional', 'Cliente muito interessado.')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_vip), (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 150000, '2023-10-25');

    -- 2. Fernanda Lima
    INSERT INTO contacts (name, email, phone, cpf, preferences, origin)
    VALUES ('Fernanda Lima', 'fernanda.lima@email.com', '(21) 98765-4321', '234.567.890-11', '{"breeds": ["Quarto de Milha"], "valueRange": "R$ 50k - R$ 100k"}'::jsonb, 'Redes Sociais')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_freq), (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 85000, '2023-10-24');

    -- 3. Carlos Venturini
    INSERT INTO contacts (name, email, phone, cpf, origin)
    VALUES ('Carlos Venturini', 'carlos.v@vet.com', '(31) 91234-5678', '345.678.901-22', 'Indicação Profissional')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_novo);

    -- 4. Haras Pôr do Sol
    INSERT INTO contacts (name, email, phone, address, preferences, origin)
    VALUES ('Haras Pôr do Sol', 'contato@haraspordosol.com.br', '(19) 3456-7890', 'Rodovia SP-304, km 120', '{"breeds": ["Lusitano", "Árabe"], "valueRange": "Acima de R$ 300k"}'::jsonb, 'Evento')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_vip), (contact_id, tag_freq);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 540000, '2023-10-22');

    -- 5. Juliana Paes
    INSERT INTO contacts (name, email, phone, cpf, origin)
    VALUES ('Juliana Paes', 'ju.paes@invest.com', '(11) 95555-4444', '456.789.012-33', 'Site')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 45000, '2023-10-21');

    -- 6. Ricardo Souza
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Ricardo Souza', 'ricardo@equestre.com', '(41) 98888-7777', 'Site')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_inativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 12000, '2023-09-15');

    -- 7. Mariana Costa
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Mariana Costa', 'mari.costa@email.com', '(51) 99999-1111', 'Redes Sociais')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_novo);

    -- 8. Fazenda Santa Fé
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Fazenda Santa Fé', 'adm@santafe.com', '(62) 3333-2222', 'Evento')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_vip);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 230000, '2023-10-18');

    -- 9. Pedro Martins
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Pedro Martins', 'pedro.m@outlook.com', '(11) 97777-6666', 'Site')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_freq);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 67000, '2023-10-15');

    -- 10. Ana Beatriz
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Ana Beatriz', 'ana.bea@gmail.com', '(31) 96666-5555', 'Redes Sociais')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 25000, '2023-10-14');

    -- 11. João Silva
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('João Silva', 'joao.silva@uol.com.br', '(11) 91111-2222', 'Indicação Profissional')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_inativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 5000, '2023-08-20');

    -- 12. Clube Hípico SP
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Clube Hípico SP', 'contato@chsp.com.br', '(11) 3333-4444', 'Evento')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_vip), (contact_id, tag_freq), (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 890000, '2023-10-25');

    -- 13. Dr. Marcelo Ramos
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Dr. Marcelo Ramos', 'm.ramos@vetcenter.com', '(19) 98888-1111', 'Site')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_novo);

    -- 14. Sofia Oliveira
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Sofia Oliveira', 'sofia.o@yahoo.com', '(21) 97777-3333', 'Redes Sociais')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 15000, '2023-10-12');

    -- 15. Miguel Santos
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Miguel Santos', 'miguel.santos@gmail.com', '(31) 99988-7766', 'Site')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_novo);

    -- 16. Haras Imperial
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Haras Imperial', 'contato@harasimperial.com', '(15) 3232-4545', 'Evento')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_vip);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 345000, '2023-10-23');

    -- 17. Lucas Ferreira
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Lucas Ferreira', 'lucas.ferreira@hotmail.com', '(41) 95555-8888', 'Indicação Profissional')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_inativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 8000, '2023-07-10');

    -- 18. Beatriz Costa
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Beatriz Costa', 'bia.costa@gmail.com', '(51) 94444-3333', 'Redes Sociais')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_freq), (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 56000, '2023-10-05');

    -- 19. Rancho fundo
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Rancho fundo', 'vendas@ranchofundo.com', '(62) 3456-7890', 'Evento')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_ativo);
    INSERT INTO purchases (contact_id, value, date) VALUES (contact_id, 32000, '2023-10-01');

    -- 20. Gabriel Souza
    INSERT INTO contacts (name, email, phone, origin)
    VALUES ('Gabriel Souza', 'gabriel.s@outlook.com', '(11) 92222-1111', 'Site')
    RETURNING id INTO contact_id;
    INSERT INTO contact_tags (contact_id, tag_id) VALUES (contact_id, tag_novo);

END $$;
