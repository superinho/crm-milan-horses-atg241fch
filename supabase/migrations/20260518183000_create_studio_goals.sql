CREATE TABLE IF NOT EXISTS public.studio_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    base_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.studio_goals ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.studio_goals;
CREATE POLICY "Enable read access for authenticated users" ON public.studio_goals
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.studio_goals;
CREATE POLICY "Enable insert access for authenticated users" ON public.studio_goals
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.studio_goals;
CREATE POLICY "Enable update access for authenticated users" ON public.studio_goals
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.studio_goals;
CREATE POLICY "Enable delete access for authenticated users" ON public.studio_goals
    FOR DELETE TO authenticated USING (true);

-- Seed default goals
INSERT INTO public.studio_goals (id, title, category, subject, description, base_text)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Curadoria de leilão', 'Radar VIP', 'Curadoria Milan Horses para {{leilao}}', 'Seleção refinada de lotes para clientes com fit claro.', 'Revendo seu perfil conosco, preparei uma curadoria objetiva e cuidadosamente filtrada. Selecionei alguns destaques que parecem bem alinhados ao seu histórico na Milan Horses.'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Convite VIP', 'Convite VIP', 'Acesso reservado: {{leilao}}', 'Convite privado para clientes de alto valor.', 'O objetivo é te dar uma visão antecipada de oportunidades compatíveis com seu perfil antes da abertura para a base completa.'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Underbidder', 'Underbidder', 'Novas oportunidades alinhadas ao seu histórico', 'Reengaja quem disputou forte e não comprou.', 'Como você costuma disputar lotes com intenção clara, há oportunidades em {{leilao}} que merecem atenção antes do fechamento.'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Reativação elegante', 'Reativação de Cliente', 'Uma seleção pensada para seu perfil', 'Retoma conversa com cliente inativo sem pressão.', 'Faz algum tempo que não nos falamos, mas {{leilao}} trouxe uma seleção que parece próxima do seu momento e do seu padrão de compra.'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Última chamada', 'Novo Leilão', 'Última chamada para {{leilao}}', 'Lembra prazo e cria urgência com sobriedade.', '{{leilao}} acontece em {{data_leilao}}, então achei importante te avisar enquanto ainda há tempo para avaliar os lotes com calma.'),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Pós-leilão', 'Pós-leilão', 'Obrigado pela participação no leilão', 'Agradece e prepara o próximo relacionamento.', 'Obrigado pela participação no leilão. Foi um prazer acompanhar seu interesse, e vou seguir atento a oportunidades realmente compatíveis com seu perfil.')
ON CONFLICT (id) DO NOTHING;
