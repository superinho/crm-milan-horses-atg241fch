-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    objective TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendada', -- Agendada, Em Andamento, Concluída, Pausada, Rascunho
    audience_filters JSONB DEFAULT '{}'::jsonb, -- Stores tags and segments selection
    channels TEXT[] DEFAULT '{}', -- Stores selected channels ['email', 'whatsapp']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_sends table (scheduled events)
CREATE TABLE IF NOT EXISTS campaign_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL, -- 'email' or 'whatsapp'
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    template_id UUID REFERENCES message_templates(id), -- Optional foreign key to message_templates
    content TEXT, -- The message content or template reference
    status TEXT NOT NULL DEFAULT 'Pendente', -- Pendente, Enviado, Falha
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated full access campaigns" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access campaign_sends" ON campaign_sends FOR ALL TO authenticated USING (true) WITH CHECK (true);
