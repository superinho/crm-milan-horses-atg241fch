-- Rename existing campaign_sends to campaign_schedules to match logical role
ALTER TABLE IF EXISTS campaign_sends RENAME TO campaign_schedules;

-- Create the new campaign_sends table for individual logs as requested
CREATE TABLE IF NOT EXISTS campaign_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES campaign_schedules(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES contacts(id),
    channel TEXT NOT NULL, -- 'email' or 'whatsapp'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'
    provider_id TEXT, -- ID from Resend or other provider
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    interacted_at TIMESTAMP WITH TIME ZONE, -- Generic last interaction field
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for the new table
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Allow authenticated full access campaign_sends" ON campaign_sends FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Update campaign_schedules columns if needed (ensure compatibility)
-- We ensure the status column exists for the schedule itself
ALTER TABLE campaign_schedules ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
