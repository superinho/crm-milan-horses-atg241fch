-- Secondary Studbook database for Brazilian sport horses.
-- This schema is intentionally separate from client CRM tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS studbook_people_orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'unknown',
    city TEXT,
    state TEXT,
    source TEXT DEFAULT 'ABCCH',
    source_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (normalized_name, role)
);

CREATE TABLE IF NOT EXISTS studbook_horses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    registration TEXT NOT NULL UNIQUE,
    microchip TEXT,
    breed TEXT,
    sex TEXT,
    birth_date DATE,
    birth_year INTEGER,
    coat TEXT,
    status TEXT,
    dna TEXT,
    breeder_id UUID REFERENCES studbook_people_orgs(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES studbook_people_orgs(id) ON DELETE SET NULL,
    birthplace TEXT,
    source_url TEXT,
    source TEXT DEFAULT 'ABCCH',
    source_payload JSONB DEFAULT '{}'::jsonb,
    data_quality_score INTEGER DEFAULT 0,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_name
ON studbook_horses USING gin (to_tsvector('simple', name));

CREATE INDEX IF NOT EXISTS idx_studbook_horses_birth_year
ON studbook_horses (birth_year);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_sex
ON studbook_horses (sex);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_breeder
ON studbook_horses (breeder_id);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_owner
ON studbook_horses (owner_id);

CREATE TABLE IF NOT EXISTS studbook_pedigree_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    horse_id UUID NOT NULL REFERENCES studbook_horses(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    related_horse_id UUID REFERENCES studbook_horses(id) ON DELETE SET NULL,
    related_name TEXT,
    generation INTEGER DEFAULT 1,
    source TEXT DEFAULT 'ABCCH',
    source_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (horse_id, relation_type, generation, related_name)
);

CREATE TABLE IF NOT EXISTS studbook_offspring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES studbook_horses(id) ON DELETE CASCADE,
    child_id UUID REFERENCES studbook_horses(id) ON DELETE SET NULL,
    child_name TEXT NOT NULL,
    child_registration TEXT,
    child_birth_date DATE,
    child_sex TEXT,
    source TEXT DEFAULT 'ABCCH',
    source_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (parent_id, child_registration, child_name)
);

CREATE TABLE IF NOT EXISTS auction_candidate_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    thesis TEXT,
    status TEXT DEFAULT 'draft',
    filters JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auction_candidate_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES auction_candidate_lists(id) ON DELETE CASCADE,
    horse_id UUID NOT NULL REFERENCES studbook_horses(id) ON DELETE CASCADE,
    reason TEXT,
    potential_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (list_id, horse_id)
);

CREATE OR REPLACE VIEW studbook_horses_enriched AS
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
        LOWER(COALESCE(h.sex, '')) LIKE '%fem%'
        AND h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) BETWEEN 3 AND 18
    ) AS is_reproductive_mare,
    (
        SELECT COUNT(*)
        FROM studbook_offspring offspring
        WHERE offspring.parent_id = h.id
    )::integer AS offspring_count
FROM studbook_horses h
LEFT JOIN studbook_people_orgs breeder ON breeder.id = h.breeder_id
LEFT JOIN studbook_people_orgs owner ON owner.id = h.owner_id;

ALTER TABLE studbook_people_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE studbook_horses ENABLE ROW LEVEL SECURITY;
ALTER TABLE studbook_pedigree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE studbook_offspring ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_candidate_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_candidate_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access studbook_people_orgs"
ON studbook_people_orgs;

CREATE POLICY "Allow authenticated full access studbook_people_orgs"
ON studbook_people_orgs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access studbook_horses"
ON studbook_horses;

CREATE POLICY "Allow authenticated full access studbook_horses"
ON studbook_horses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access studbook_pedigree_links"
ON studbook_pedigree_links;

CREATE POLICY "Allow authenticated full access studbook_pedigree_links"
ON studbook_pedigree_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access studbook_offspring"
ON studbook_offspring;

CREATE POLICY "Allow authenticated full access studbook_offspring"
ON studbook_offspring FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access auction_candidate_lists"
ON auction_candidate_lists;

CREATE POLICY "Allow authenticated full access auction_candidate_lists"
ON auction_candidate_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access auction_candidate_items"
ON auction_candidate_items;

CREATE POLICY "Allow authenticated full access auction_candidate_items"
ON auction_candidate_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON studbook_horses_enriched TO authenticated;
