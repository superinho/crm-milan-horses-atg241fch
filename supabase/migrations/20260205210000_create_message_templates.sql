CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('WhatsApp', 'E-mail')),
    subject TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON message_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON message_templates
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON message_templates
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON message_templates
    FOR DELETE TO authenticated USING (true);

-- Seed Data
INSERT INTO message_templates (title, category, type, subject, body) VALUES
('Boas-vindas Padrão', 'Boas-vindas', 'WhatsApp', NULL, 'Olá {{nome}}, seja bem-vindo ao Milan Horses! É um prazer ter você conosco.'),
('Convite Novo Leilão', 'Novo Leilão', 'WhatsApp', NULL, 'Olá {{nome}}, convidamos você para o nosso próximo leilão {{leilao}}. Não perca!'),
('Lance Superado', 'Informações de Lote', 'WhatsApp', NULL, 'Olá {{nome}}, seu lance no lote {{lote}} foi superado. O valor atual é {{valor}}.'),
('Email de Aniversário', 'Aniversário', 'E-mail', 'Parabéns {{nome}}!', 'Feliz aniversário {{nome}}! Desejamos muitas conquistas e felicidades.');
