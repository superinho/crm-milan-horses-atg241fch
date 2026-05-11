-- Marketing delivery layer for Radar VIP, Resend and BotConversa.
-- Keeps compatibility with the existing campaign screens while adding
-- per-recipient queues, provider payloads and event tracking.

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Rascunho',
    audience_filters JSONB DEFAULT '{}'::jsonb,
    channels TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'whatsapp')),
    scheduled_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    subject TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    status TEXT NOT NULL DEFAULT 'queued',
    score INTEGER DEFAULT 0,
    segment TEXT,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    opted_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (campaign_id, contact_id, channel)
);

CREATE TABLE IF NOT EXISTS campaign_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES campaign_schedules(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    campaign_recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    status TEXT NOT NULL DEFAULT 'pending',
    provider_id TEXT,
    subject TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    interacted_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbound_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    campaign_recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE SET NULL,
    campaign_send_id UUID REFERENCES campaign_sends(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    provider TEXT NOT NULL CHECK (provider IN ('resend', 'botconversa')),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
    to_address TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    provider_message_id TEXT,
    request_payload JSONB DEFAULT '{}'::jsonb,
    response_payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbound_message_id UUID REFERENCES outbound_messages(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS variables TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients (status);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON campaign_sends (status);
CREATE INDEX IF NOT EXISTS idx_outbound_messages_campaign ON outbound_messages (campaign_id);
CREATE INDEX IF NOT EXISTS idx_outbound_messages_provider_id ON outbound_messages (provider_message_id);
CREATE INDEX IF NOT EXISTS idx_message_events_campaign ON message_events (campaign_id);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access campaigns"
ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaigns"
ON campaigns FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access campaign_schedules"
ON campaign_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaign_schedules"
ON campaign_schedules FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access campaign_recipients"
ON campaign_recipients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaign_recipients"
ON campaign_recipients FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access campaign_sends"
ON campaign_sends FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaign_sends"
ON campaign_sends FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access outbound_messages"
ON outbound_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access outbound_messages"
ON outbound_messages FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access message_events"
ON message_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access message_events"
ON message_events FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO message_templates (title, category, type, subject, body, variables)
VALUES
(
  'Radar VIP - Convite E-mail',
  'Radar VIP',
  'E-mail',
  'Curadoria Milan Horses: {{leilao}}',
  '<p>Olá {{nome}}, tudo bem?</p><p>Separei uma curadoria rápida do leilão <strong>{{leilao}}</strong> porque seu histórico na Milan Horses indica alta compatibilidade com os lotes.</p><p>Posso te enviar os destaques antes do leilão?</p>',
  ARRAY['nome', 'leilao']
),
(
  'Radar VIP - WhatsApp',
  'Radar VIP',
  'WhatsApp',
  NULL,
  'Olá {{nome}}. {{leilao}} está chegando e selecionei alguns lotes que combinam com seu perfil na Milan Horses. Posso te enviar uma curadoria rápida?',
  ARRAY['nome', 'leilao']
)
ON CONFLICT DO NOTHING;
