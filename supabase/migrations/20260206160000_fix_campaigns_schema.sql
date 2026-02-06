-- Drop existing tables to ensure clean slate with correct schema
DROP TABLE IF EXISTS campaign_sends;
DROP TABLE IF EXISTS campaigns;

-- Create campaigns table with specified columns and UI support columns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT, -- Replaces objective field
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Agendada',
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional columns to support existing UI components
    audience_filters JSONB DEFAULT '{}'::jsonb,
    channels TEXT[] DEFAULT '{}'
);

-- Create campaign_sends table for scheduling
CREATE TABLE campaign_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    template_id UUID,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow authenticated full access campaigns" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access campaign_sends" ON campaign_sends FOR ALL TO authenticated USING (true) WITH CHECK (true);
