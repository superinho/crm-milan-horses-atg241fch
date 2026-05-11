-- Smart Leilões integration foundation for the Milan Horses marketing CRM.
-- Keeps raw API payloads for auditability and normalizes the core entities used by RFMV.

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS smartleiloes_id TEXT,
ADD COLUMN IF NOT EXISTS document TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS source_payload JSONB DEFAULT '{}'::jsonb;

DROP INDEX IF EXISTS idx_contacts_smartleiloes_id;
CREATE UNIQUE INDEX idx_contacts_smartleiloes_id
ON contacts (smartleiloes_id);

CREATE INDEX IF NOT EXISTS idx_contacts_document ON contacts (document);

CREATE TABLE IF NOT EXISTS smartleiloes_auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    smartleiloes_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT,
    value NUMERIC(14, 2) DEFAULT 0,
    event_date TIMESTAMP WITH TIME ZONE,
    event_type TEXT,
    source_url TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartleiloes_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    smartleiloes_id TEXT NOT NULL UNIQUE,
    auction_id UUID REFERENCES smartleiloes_auctions(id) ON DELETE SET NULL,
    auction_smartleiloes_id TEXT,
    lot_number TEXT,
    title TEXT NOT NULL,
    category TEXT,
    commercial_status TEXT,
    value NUMERIC(14, 2) DEFAULT 0,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bids
ADD COLUMN IF NOT EXISTS smartleiloes_id TEXT,
ADD COLUMN IF NOT EXISTS smartleiloes_lot_id TEXT,
ADD COLUMN IF NOT EXISTS smartleiloes_event_id TEXT,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

DROP INDEX IF EXISTS idx_bids_smartleiloes_id;
CREATE UNIQUE INDEX idx_bids_smartleiloes_id
ON bids (smartleiloes_id);

ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS smartleiloes_id TEXT,
ADD COLUMN IF NOT EXISTS smartleiloes_event_id TEXT,
ADD COLUMN IF NOT EXISTS smartleiloes_lot_id TEXT,
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

DROP INDEX IF EXISTS idx_purchases_smartleiloes_id;
CREATE UNIQUE INDEX idx_purchases_smartleiloes_id
ON purchases (smartleiloes_id);

CREATE TABLE IF NOT EXISTS smartleiloes_raw_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT,
    amount NUMERIC(14, 2) DEFAULT 0,
    record_date TIMESTAMP WITH TIME ZONE,
    related_event_id TEXT,
    related_client_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (record_type, external_id)
);

CREATE TABLE IF NOT EXISTS smartleiloes_sync_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    summary JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW customer_rfmv_view AS
WITH purchase_stats AS (
    SELECT
        contact_id,
        COUNT(*)::integer AS purchase_count,
        COALESCE(SUM(value), 0)::numeric AS monetary_value,
        COALESCE(AVG(value), 0)::numeric AS avg_ticket,
        MAX(date) AS last_purchase_date
    FROM purchases
    WHERE contact_id IS NOT NULL
    GROUP BY contact_id
),
bid_stats AS (
    SELECT
        contact_id,
        COUNT(*)::integer AS bid_count,
        COUNT(DISTINCT auction_id)::integer AS auction_count,
        COALESCE(SUM(value), 0)::numeric AS bid_value,
        MAX(date) AS last_bid_date
    FROM bids
    WHERE contact_id IS NOT NULL
    GROUP BY contact_id
),
base AS (
    SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.whatsapp,
        c.city,
        c.state,
        c.created_at,
        COALESCE(p.purchase_count, 0) AS purchase_count,
        COALESCE(p.monetary_value, 0) AS monetary_value,
        COALESCE(p.avg_ticket, 0) AS avg_ticket,
        p.last_purchase_date,
        COALESCE(b.bid_count, 0) AS bid_count,
        COALESCE(b.auction_count, 0) AS auction_count,
        COALESCE(b.bid_value, 0) AS bid_value,
        b.last_bid_date,
        GREATEST(
            COALESCE(p.last_purchase_date, DATE '1900-01-01'),
            COALESCE(b.last_bid_date, DATE '1900-01-01'),
            COALESCE(c.created_at::date, DATE '1900-01-01')
        ) AS last_activity_date
    FROM contacts c
    LEFT JOIN purchase_stats p ON p.contact_id = c.id
    LEFT JOIN bid_stats b ON b.contact_id = c.id
)
SELECT
    *,
    CASE
        WHEN last_activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN 5
        WHEN last_activity_date >= CURRENT_DATE - INTERVAL '90 days' THEN 4
        WHEN last_activity_date >= CURRENT_DATE - INTERVAL '180 days' THEN 3
        WHEN last_activity_date >= CURRENT_DATE - INTERVAL '365 days' THEN 2
        ELSE 1
    END AS recency_score,
    CASE
        WHEN purchase_count + bid_count >= 20 THEN 5
        WHEN purchase_count + bid_count >= 10 THEN 4
        WHEN purchase_count + bid_count >= 5 THEN 3
        WHEN purchase_count + bid_count >= 2 THEN 2
        ELSE 1
    END AS frequency_score,
    CASE
        WHEN monetary_value >= 500000 THEN 5
        WHEN monetary_value >= 250000 THEN 4
        WHEN monetary_value >= 100000 THEN 3
        WHEN monetary_value > 0 THEN 2
        ELSE 1
    END AS monetary_score,
    CASE
        WHEN auction_count >= 8 OR bid_value >= 500000 THEN 5
        WHEN auction_count >= 5 OR bid_value >= 250000 THEN 4
        WHEN auction_count >= 3 OR bid_value >= 100000 THEN 3
        WHEN bid_count > 0 THEN 2
        ELSE 1
    END AS variety_score,
    (
        CASE
            WHEN last_activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN 5
            WHEN last_activity_date >= CURRENT_DATE - INTERVAL '90 days' THEN 4
            WHEN last_activity_date >= CURRENT_DATE - INTERVAL '180 days' THEN 3
            WHEN last_activity_date >= CURRENT_DATE - INTERVAL '365 days' THEN 2
            ELSE 1
        END
        +
        CASE
            WHEN purchase_count + bid_count >= 20 THEN 5
            WHEN purchase_count + bid_count >= 10 THEN 4
            WHEN purchase_count + bid_count >= 5 THEN 3
            WHEN purchase_count + bid_count >= 2 THEN 2
            ELSE 1
        END
        +
        CASE
            WHEN monetary_value >= 500000 THEN 5
            WHEN monetary_value >= 250000 THEN 4
            WHEN monetary_value >= 100000 THEN 3
            WHEN monetary_value > 0 THEN 2
            ELSE 1
        END
        +
        CASE
            WHEN auction_count >= 8 OR bid_value >= 500000 THEN 5
            WHEN auction_count >= 5 OR bid_value >= 250000 THEN 4
            WHEN auction_count >= 3 OR bid_value >= 100000 THEN 3
            WHEN bid_count > 0 THEN 2
            ELSE 1
        END
    ) AS rfmv_score,
    CASE
        WHEN monetary_value >= 500000 AND last_activity_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'VIP ativo'
        WHEN monetary_value >= 500000 THEN 'VIP inativo'
        WHEN bid_count >= 5 AND purchase_count = 0 THEN 'Alto potencial sem compra'
        WHEN purchase_count > 0 AND last_activity_date < CURRENT_DATE - INTERVAL '180 days' THEN 'Reativação'
        WHEN purchase_count > 0 THEN 'Comprador'
        WHEN bid_count > 0 THEN 'Interessado'
        ELSE 'Lead'
    END AS segment
FROM base;

ALTER TABLE smartleiloes_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartleiloes_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartleiloes_raw_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartleiloes_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access smartleiloes_auctions"
ON smartleiloes_auctions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access smartleiloes_lots"
ON smartleiloes_lots FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read smartleiloes_raw_records"
ON smartleiloes_raw_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read smartleiloes_sync_runs"
ON smartleiloes_sync_runs FOR SELECT TO authenticated USING (true);

GRANT SELECT ON customer_rfmv_view TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can manage own avatar"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
