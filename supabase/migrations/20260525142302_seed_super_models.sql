DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Convite VIP') THEN
    INSERT INTO public.message_templates (title, category, type, subject, body, variables)
    VALUES ('Super Convite VIP', 'Convite VIP', 'E-mail', '{{nome}}, preview privado | {{leilao}}', 
    '<h2>Private Client Preview</h2><h1>{{leilao}}</h1><p>Olá, {{nome}}.</p><p>Você está na lista curta para receber a prévia privada do {{leilao}}. A ideia não é enviar um catálogo inteiro, mas uma seleção com leitura comercial clara: o que merece atenção, por que agora e qual seria o próximo passo.</p><h3>O que olhar primeiro</h3><ul><li>Lotes com tese comercial objetiva</li><li>Oportunidades com boa relação entre qualidade e liquidez</li></ul><p>Até breve,</p>', 
    ARRAY['{{nome}}', '{{leilao}}']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Curadoria de Lote') THEN
    INSERT INTO public.message_templates (title, category, type, subject, body, variables)
    VALUES ('Super Curadoria de Lote', 'Informações de Lote', 'E-mail', 'Curadoria Milan | {{lote}}', 
    '<h2>Milan Object Note</h2><h1>{{lote}}</h1><p>Olá, {{nome}}.</p><p>Preparei esta nota porque {{lote}} merece uma leitura de valor, não apenas uma descrição. O ponto principal é entender se a oportunidade combina com objetivo, preço e momento de compra.</p><h3>Resumo executivo</h3><p>Faixa de referência: {{valor}}</p><p>Aderência ao perfil: alta se a busca for qualidade com disciplina comercial</p><p>Se fizer sentido, eu te envio uma análise mais completa.</p>', 
    ARRAY['{{nome}}', '{{lote}}', '{{valor}}']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Underbidder') THEN
    INSERT INTO public.message_templates (title, category, type, subject, body, variables)
    VALUES ('Super Underbidder', 'Underbidder', 'E-mail', '{{nome}}, próximo passo sobre {{lote}}', 
    '<h2>Private Advisory</h2><h1>{{lote}}</h1><p>Olá, {{nome}}.</p><p>Vi que você ficou muito perto em {{lote}}. Quando isso acontece, o melhor próximo passo não é insistir automaticamente. É decidir com clareza entre acompanhar negociação, buscar alternativa equivalente ou esperar a próxima janela certa.</p><h3>Plano em 24 horas</h3><ul><li>Revisar se ainda existe margem de negociação</li><li>Mapear alternativa com perfil semelhante</li></ul><p>Abraço,</p>', 
    ARRAY['{{nome}}', '{{lote}}']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Reativação') THEN
    INSERT INTO public.message_templates (title, category, type, subject, body, variables)
    VALUES ('Super Reativação', 'Reativação de Cliente', 'E-mail', '{{nome}}, uma curadoria rápida para você', 
    '<h2>Milan Concierge</h2><h1>Curadoria privada</h1><p>Olá, {{nome}}.</p><p>Faz algum tempo que não falamos. Preferi retomar de forma simples: estou organizando uma seleção curta, com poucas oportunidades e contexto suficiente para você decidir se vale olhar agora.</p><p>A curadoria ideal para esta retomada deve ser breve, visual e objetiva: oportunidade, racional, faixa de valor e recomendação.</p>', 
    ARRAY['{{nome}}']);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.message_templates WHERE title = 'Super Pós-leilão') THEN
    INSERT INTO public.message_templates (title, category, type, subject, body, variables)
    VALUES ('Super Pós-leilão', 'Pós-leilão', 'E-mail', 'Próximos passos | {{leilao}}', 
    '<h2>After Sale Care</h2><h1>{{leilao}}</h1><p>Olá, {{nome}}.</p><p>Obrigado pela participação no {{leilao}}. Estou deixando abaixo um caminho simples para organizar os próximos passos e manter tudo claro.</p><h3>Como podemos ajudar</h3><ul><li>Documentação e acompanhamento</li><li>Dúvidas sobre pagamento ou retirada</li><li>Oportunidades relacionadas ao seu interesse</li></ul><p>Conte conosco,</p>', 
    ARRAY['{{nome}}', '{{leilao}}']);
  END IF;
END $$;
