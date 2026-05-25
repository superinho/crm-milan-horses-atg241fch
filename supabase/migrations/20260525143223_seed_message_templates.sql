ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS is_super_model boolean DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Boas-vindas ao VIP') THEN
    INSERT INTO public.message_templates (id, title, category, type, subject, body, variables, is_super_model)
    VALUES (
      gen_random_uuid(),
      'Boas-vindas ao VIP',
      'Boas-vindas',
      'WhatsApp',
      NULL,
      'Olá {{nome}}! Seja muito bem-vindo à lista VIP da Milan Horses. Estamos à disposição para ajudá-lo a encontrar os melhores cavalos.',
      ARRAY['{{nome}}'],
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Novo Catálogo de Cavalos') THEN
    INSERT INTO public.message_templates (id, title, category, type, subject, body, variables, is_super_model)
    VALUES (
      gen_random_uuid(),
      'Novo Catálogo de Cavalos',
      'Novo Leilão',
      'E-mail',
      'Confira nosso novo catálogo: {{leilao}}',
      'Olá {{nome}},<br><br>É com grande satisfação que apresentamos o novo catálogo do leilão <b>{{leilao}}</b>.<br><br>Atenciosamente,<br>Equipe Milan Horses',
      ARRAY['{{nome}}', '{{leilao}}'],
      true
    );
  END IF;
END $$;
