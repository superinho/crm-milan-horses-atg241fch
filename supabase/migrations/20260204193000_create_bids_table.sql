-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    auction_id TEXT,
    lot_number TEXT,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow authenticated full access bids" ON bids FOR ALL TO authenticated USING (true) WITH CHECK (true);
