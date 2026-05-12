-- Bulk import support for the secondary ABCCH Studbook database.
-- These tables remain intentionally separate from CRM/client data.

DROP VIEW IF EXISTS studbook_horses_enriched;

ALTER TABLE studbook_horses
    ADD COLUMN IF NOT EXISTS abcch_token TEXT,
    ADD COLUMN IF NOT EXISTS original_registration TEXT,
    ADD COLUMN IF NOT EXISTS ueln TEXT,
    ADD COLUMN IF NOT EXISTS sire_name TEXT,
    ADD COLUMN IF NOT EXISTS dam_name TEXT,
    ADD COLUMN IF NOT EXISTS abcch_owner_token TEXT,
    ADD COLUMN IF NOT EXISTS abcch_breeder_token TEXT,
    ADD COLUMN IF NOT EXISTS abcch_detail_synced_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS abcch_detail_sync_status TEXT,
    ADD COLUMN IF NOT EXISTS abcch_detail_error TEXT,
    ADD COLUMN IF NOT EXISTS import_batch_id UUID,
    ADD COLUMN IF NOT EXISTS source_checksum TEXT;

ALTER TABLE studbook_horses
    ALTER COLUMN registration DROP NOT NULL;

ALTER TABLE studbook_horses
    DROP CONSTRAINT IF EXISTS studbook_horses_registration_key;

DROP INDEX IF EXISTS idx_studbook_horses_abcch_token_unique;

CREATE UNIQUE INDEX IF NOT EXISTS studbook_horses_abcch_token_key
ON studbook_horses (abcch_token);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_registration
ON studbook_horses (registration);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_updated_at
ON studbook_horses (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_studbook_offspring_parent
ON studbook_offspring (parent_id);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_sire_name
ON studbook_horses USING gin (to_tsvector('simple', COALESCE(sire_name, '')));

CREATE INDEX IF NOT EXISTS idx_studbook_horses_dam_name
ON studbook_horses USING gin (to_tsvector('simple', COALESCE(dam_name, '')));

CREATE INDEX IF NOT EXISTS idx_studbook_horses_detail_synced
ON studbook_horses (abcch_detail_synced_at);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_detail_status
ON studbook_horses (abcch_detail_sync_status);

CREATE TABLE IF NOT EXISTS studbook_import_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL DEFAULT 'ABCCH',
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    search_terms JSONB DEFAULT '[]'::jsonb,
    total_source_rows INTEGER DEFAULT 0,
    unique_tokens INTEGER DEFAULT 0,
    inserted_or_updated_horses INTEGER DEFAULT 0,
    inserted_or_updated_people INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    notes TEXT
);

ALTER TABLE studbook_import_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access studbook_import_runs"
ON studbook_import_runs;

CREATE POLICY "Allow authenticated full access studbook_import_runs"
ON studbook_import_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read studbook_people_orgs"
ON studbook_people_orgs;

CREATE POLICY "Allow anon read studbook_people_orgs"
ON studbook_people_orgs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read studbook_horses"
ON studbook_horses;

CREATE POLICY "Allow anon read studbook_horses"
ON studbook_horses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read studbook_pedigree_links"
ON studbook_pedigree_links;

CREATE POLICY "Allow anon read studbook_pedigree_links"
ON studbook_pedigree_links FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read studbook_offspring"
ON studbook_offspring;

CREATE POLICY "Allow anon read studbook_offspring"
ON studbook_offspring FOR SELECT TO anon USING (true);

CREATE OR REPLACE VIEW studbook_horses_enriched AS
WITH offspring_counts AS (
    SELECT parent_id, COUNT(*)::integer AS offspring_count
    FROM studbook_offspring
    GROUP BY parent_id
)
SELECT
    h.*,
    breeder.name AS breeder_name,
    owner.name AS owner_name,
    CASE
        WHEN h.birth_date IS NULL THEN NULL
        ELSE DATE_PART('year', AGE(CURRENT_DATE, h.birth_date))::integer
    END AS age_years,
    CASE
        WHEN h.birth_date IS NULL THEN 'sem data'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) < 3 THEN '0-2 anos'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) < 6 THEN '3-5 anos'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) < 11 THEN '6-10 anos'
        WHEN DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) < 17 THEN '11-16 anos'
        ELSE '17+ anos'
    END AS age_band,
    (
        LOWER(COALESCE(h.sex, '')) LIKE '%f%'
        AND h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) BETWEEN 3 AND 18
    ) AS is_reproductive_mare,
    COALESCE(offspring_counts.offspring_count, 0)::integer AS offspring_count
FROM studbook_horses h
LEFT JOIN studbook_people_orgs breeder ON breeder.id = h.breeder_id
LEFT JOIN studbook_people_orgs owner ON owner.id = h.owner_id
LEFT JOIN offspring_counts ON offspring_counts.parent_id = h.id;

GRANT SELECT ON studbook_people_orgs TO anon;
GRANT SELECT ON studbook_horses TO anon;
GRANT SELECT ON studbook_pedigree_links TO anon;
GRANT SELECT ON studbook_offspring TO anon;
GRANT SELECT ON studbook_horses_enriched TO authenticated;
GRANT SELECT ON studbook_horses_enriched TO anon;
