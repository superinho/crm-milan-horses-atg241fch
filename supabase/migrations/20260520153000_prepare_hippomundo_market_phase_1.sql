-- Hippomundo phase 1 preparation for Mercado Global.
-- This migration prepares source governance and a slow crawl queue, but it does
-- not extract Hippomundo data.

ALTER TABLE global_auction_sources
    ADD COLUMN IF NOT EXISTS primary_source BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER DEFAULT 6,
    ADD COLUMN IF NOT EXISTS crawl_delay_ms INTEGER DEFAULT 10000,
    ADD COLUMN IF NOT EXISTS terms_url TEXT,
    ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE global_auction_import_runs
    ADD COLUMN IF NOT EXISTS extraction_phase TEXT DEFAULT 'manual_or_seed',
    ADD COLUMN IF NOT EXISTS rate_limit_ms INTEGER,
    ADD COLUMN IF NOT EXISTS source_terms JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS global_auction_crawl_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES global_auction_sources(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    entity_kind TEXT NOT NULL DEFAULT 'auction',
    priority INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'queued',
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (source_url, entity_kind)
);

CREATE INDEX IF NOT EXISTS idx_global_auction_crawl_queue_due
ON global_auction_crawl_queue (status, scheduled_at, priority);

CREATE INDEX IF NOT EXISTS idx_global_auction_sources_primary
ON global_auction_sources (primary_source, status);

ALTER TABLE global_auction_crawl_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access global_auction_crawl_queue"
ON global_auction_crawl_queue;
CREATE POLICY "Allow authenticated full access global_auction_crawl_queue"
ON global_auction_crawl_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO global_auction_sources (
    name,
    source_type,
    country,
    website_url,
    results_url,
    discipline_scope,
    scrape_strategy,
    access_level,
    status,
    notes,
    primary_source,
    rate_limit_per_minute,
    crawl_delay_ms,
    terms_url
) VALUES (
    'Hippomundo',
    'market_database',
    NULL,
    'https://www.hippomundo.com/en',
    'https://www.hippomundo.com/en/auctions',
    'show_jumping',
    'incremental_html_with_snapshot',
    'public',
    'active',
    'Fonte primaria planejada para Mercado Global. Coleta incremental, lenta, com snapshots e links para a fonte original.',
    TRUE,
    6,
    10000,
    'https://www.hippomundo.com/en'
)
ON CONFLICT (name) DO UPDATE SET
    source_type = EXCLUDED.source_type,
    website_url = EXCLUDED.website_url,
    results_url = EXCLUDED.results_url,
    discipline_scope = EXCLUDED.discipline_scope,
    scrape_strategy = EXCLUDED.scrape_strategy,
    access_level = EXCLUDED.access_level,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    primary_source = EXCLUDED.primary_source,
    rate_limit_per_minute = EXCLUDED.rate_limit_per_minute,
    crawl_delay_ms = EXCLUDED.crawl_delay_ms,
    terms_url = EXCLUDED.terms_url,
    updated_at = NOW();

GRANT SELECT ON global_auction_crawl_queue TO anon;
