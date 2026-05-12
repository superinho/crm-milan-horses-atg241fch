-- Global show jumping auction market.
-- This is a secondary market-intelligence database, separate from Milan CRM contacts
-- and from the Brazilian Studbook import.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS global_auction_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL DEFAULT 'auction_house',
    country TEXT,
    website_url TEXT,
    results_url TEXT,
    discipline_scope TEXT NOT NULL DEFAULT 'show_jumping',
    scrape_strategy TEXT NOT NULL DEFAULT 'html_table',
    access_level TEXT NOT NULL DEFAULT 'public',
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS global_auction_import_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES global_auction_sources(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    source_url TEXT,
    rows_seen INTEGER DEFAULT 0,
    rows_imported INTEGER DEFAULT 0,
    rows_skipped INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS global_auction_source_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES global_auction_sources(id) ON DELETE SET NULL,
    import_run_id UUID REFERENCES global_auction_import_runs(id) ON DELETE SET NULL,
    source_url TEXT NOT NULL,
    content_type TEXT,
    checksum TEXT NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (source_url, checksum)
);

CREATE TABLE IF NOT EXISTS global_auction_houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES global_auction_sources(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE,
    country TEXT,
    website_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS global_auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID REFERENCES global_auction_houses(id) ON DELETE SET NULL,
    source_id UUID REFERENCES global_auction_sources(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    auction_year INTEGER,
    auction_date DATE,
    location TEXT,
    country TEXT,
    discipline TEXT NOT NULL DEFAULT 'show_jumping',
    category TEXT,
    source_url TEXT,
    source_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (source_id, normalized_name, auction_year)
);

CREATE TABLE IF NOT EXISTS global_auction_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES global_auctions(id) ON DELETE CASCADE,
    source_id UUID REFERENCES global_auction_sources(id) ON DELETE SET NULL,
    lot_number TEXT,
    horse_name TEXT NOT NULL,
    normalized_horse_name TEXT NOT NULL,
    birth_year INTEGER,
    age INTEGER,
    sex TEXT,
    color TEXT,
    studbook TEXT,
    sire_name TEXT,
    dam_name TEXT,
    dam_sire_name TEXT,
    vendor_name TEXT,
    breeder_name TEXT,
    buyer_name TEXT,
    buyer_country TEXT,
    sold_status TEXT NOT NULL DEFAULT 'sold',
    hammer_price NUMERIC,
    currency TEXT NOT NULL DEFAULT 'EUR',
    price_text TEXT,
    discipline TEXT NOT NULL DEFAULT 'show_jumping',
    source_url TEXT,
    source_payload JSONB DEFAULT '{}'::jsonb,
    confidence_score INTEGER DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (auction_id, lot_number, normalized_horse_name)
);

CREATE INDEX IF NOT EXISTS idx_global_auction_lots_horse_name
ON global_auction_lots USING gin (to_tsvector('simple', horse_name));

CREATE INDEX IF NOT EXISTS idx_global_auction_lots_sire
ON global_auction_lots (sire_name);

CREATE INDEX IF NOT EXISTS idx_global_auction_lots_price
ON global_auction_lots (hammer_price);

CREATE INDEX IF NOT EXISTS idx_global_auctions_year
ON global_auctions (auction_year);

CREATE OR REPLACE VIEW global_auction_market_overview AS
SELECT
    COUNT(DISTINCT a.id)::integer AS auctions,
    COUNT(l.id)::integer AS lots,
    COUNT(l.id) FILTER (WHERE l.sold_status = 'sold')::integer AS sold_lots,
    COUNT(l.id) FILTER (WHERE l.sold_status <> 'sold')::integer AS unsold_or_withdrawn_lots,
    COALESCE(SUM(l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS total_sold_value_eur,
    COALESCE(AVG(l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS average_price_eur,
    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS median_price_eur,
    MAX(l.hammer_price) FILTER (WHERE l.sold_status = 'sold')::numeric AS top_price_eur,
    MIN(a.auction_year)::integer AS first_year,
    MAX(a.auction_year)::integer AS latest_year
FROM global_auctions a
LEFT JOIN global_auction_lots l ON l.auction_id = a.id;

CREATE OR REPLACE VIEW global_auction_sire_rankings AS
SELECT
    COALESCE(NULLIF(TRIM(l.sire_name), ''), 'Não informado') AS sire_name,
    COUNT(l.id)::integer AS lots,
    COUNT(l.id) FILTER (WHERE l.sold_status = 'sold')::integer AS sold_lots,
    COALESCE(SUM(l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS total_value_eur,
    COALESCE(AVG(l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS average_price_eur,
    MAX(l.hammer_price) FILTER (WHERE l.sold_status = 'sold')::numeric AS top_price_eur,
    MAX(a.auction_year)::integer AS latest_year
FROM global_auction_lots l
JOIN global_auctions a ON a.id = l.auction_id
WHERE l.sire_name IS NOT NULL AND TRIM(l.sire_name) <> ''
GROUP BY COALESCE(NULLIF(TRIM(l.sire_name), ''), 'Não informado');

CREATE OR REPLACE VIEW global_auction_house_rankings AS
SELECT
    h.name AS house_name,
    h.country,
    COUNT(DISTINCT a.id)::integer AS auctions,
    COUNT(l.id)::integer AS lots,
    COUNT(l.id) FILTER (WHERE l.sold_status = 'sold')::integer AS sold_lots,
    COALESCE(SUM(l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS total_value_eur,
    COALESCE(AVG(l.hammer_price) FILTER (WHERE l.sold_status = 'sold'), 0)::numeric AS average_price_eur,
    MAX(l.hammer_price) FILTER (WHERE l.sold_status = 'sold')::numeric AS top_price_eur,
    MAX(a.auction_year)::integer AS latest_year
FROM global_auction_houses h
LEFT JOIN global_auctions a ON a.house_id = h.id
LEFT JOIN global_auction_lots l ON l.auction_id = a.id
GROUP BY h.id, h.name, h.country;

ALTER TABLE global_auction_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_auction_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_auction_source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_auction_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_auction_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access global_auction_sources"
ON global_auction_sources;
CREATE POLICY "Allow authenticated full access global_auction_sources"
ON global_auction_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access global_auction_import_runs"
ON global_auction_import_runs;
CREATE POLICY "Allow authenticated full access global_auction_import_runs"
ON global_auction_import_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access global_auction_source_snapshots"
ON global_auction_source_snapshots;
CREATE POLICY "Allow authenticated full access global_auction_source_snapshots"
ON global_auction_source_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access global_auction_houses"
ON global_auction_houses;
CREATE POLICY "Allow authenticated full access global_auction_houses"
ON global_auction_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access global_auctions"
ON global_auctions;
CREATE POLICY "Allow authenticated full access global_auctions"
ON global_auctions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access global_auction_lots"
ON global_auction_lots;
CREATE POLICY "Allow authenticated full access global_auction_lots"
ON global_auction_lots FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read global_auction_sources"
ON global_auction_sources;
CREATE POLICY "Allow anon read global_auction_sources"
ON global_auction_sources FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read global_auction_houses"
ON global_auction_houses;
CREATE POLICY "Allow anon read global_auction_houses"
ON global_auction_houses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read global_auctions"
ON global_auctions;
CREATE POLICY "Allow anon read global_auctions"
ON global_auctions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read global_auction_lots"
ON global_auction_lots;
CREATE POLICY "Allow anon read global_auction_lots"
ON global_auction_lots FOR SELECT TO anon USING (true);

GRANT SELECT ON global_auction_market_overview TO authenticated;
GRANT SELECT ON global_auction_sire_rankings TO authenticated;
GRANT SELECT ON global_auction_house_rankings TO authenticated;
GRANT SELECT ON global_auction_market_overview TO anon;
GRANT SELECT ON global_auction_sire_rankings TO anon;
GRANT SELECT ON global_auction_house_rankings TO anon;
