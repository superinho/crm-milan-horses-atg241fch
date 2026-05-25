-- Fix Auth User
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'melanasvaz@gmail.com') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'melanasvaz@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );
  END IF;
END $$;

-- Message Templates RLS
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.message_templates;
CREATE POLICY "Enable all access for authenticated users" ON public.message_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure table has is_super_model column
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS is_super_model boolean DEFAULT false;

-- Insert default Super Modelos if missing
INSERT INTO public.message_templates (id, title, category, type, subject, body, is_super_model)
SELECT gen_random_uuid(), 'Super Convite VIP', 'Convite VIP', 'E-mail', '{{nome}}, preview privado | {{leilao}}', '<p>Uma seleção reservada para compradores que valorizam curadoria, timing e execução discreta.</p>', true
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Convite VIP');

INSERT INTO public.message_templates (id, title, category, type, subject, body, is_super_model)
SELECT gen_random_uuid(), 'Super Curadoria de Lote', 'Informações de Lote', 'E-mail', 'Curadoria Milan | {{lote}}', '<p>Uma análise curta, visual e decisiva para avaliar {{lote}}.</p>', true
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Curadoria de Lote');

INSERT INTO public.message_templates (id, title, category, type, subject, body, is_super_model)
SELECT gen_random_uuid(), 'Super Underbidder', 'Underbidder', 'E-mail', '{{nome}}, próximo passo sobre {{lote}}', '<p>Uma resposta privada para transformar quase-compra em próximo passo inteligente.</p>', true
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Underbidder');

INSERT INTO public.message_templates (id, title, category, type, subject, body, is_super_model)
SELECT gen_random_uuid(), 'Super Reativação', 'Reativação de Cliente', 'E-mail', '{{nome}}, uma curadoria rápida para você', '<p>Uma retomada elegante, curta e sem pressão.</p>', true
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Reativação');

INSERT INTO public.message_templates (id, title, category, type, subject, body, is_super_model)
SELECT gen_random_uuid(), 'Super Pós-leilão', 'Pós-leilão', 'E-mail', 'Próximos passos | {{leilao}}', '<p>Encerramento elegante, acompanhamento claro e continuidade comercial.</p>', true
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Pós-leilão');
