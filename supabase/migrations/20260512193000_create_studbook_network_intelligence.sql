-- Network intelligence for the secondary Studbook database.
-- These views keep breeder, owner and genealogy analytics separate from CRM contacts.

CREATE INDEX IF NOT EXISTS idx_studbook_horses_sire_name_btree
ON studbook_horses (sire_name);

CREATE INDEX IF NOT EXISTS idx_studbook_horses_dam_name_btree
ON studbook_horses (dam_name);

CREATE OR REPLACE FUNCTION is_actionable_studbook_name(value TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT NULLIF(TRIM(value), '') IS NOT NULL
        AND UPPER(TRIM(value)) NOT IN (
            'NAO CADASTRADA',
            'NÃO CADASTRADA',
            'NAO CADASTRADO',
            'NÃO CADASTRADO',
            'NAO INFORMADA',
            'NÃO INFORMADA',
            'NAO INFORMADO',
            'NÃO INFORMADO',
            'PENDENTE',
            'PENDENTE - ABCCH',
            'SEM REGISTRO',
            'DESCONHECIDO',
            'DESCONHECIDA'
        );
$$;

CREATE OR REPLACE VIEW studbook_breeder_rankings AS
SELECT
    breeder.id::text AS entity_id,
    'breeder'::text AS entity_kind,
    breeder.name,
    COUNT(h.id)::integer AS horse_count,
    COUNT(h.id) FILTER (WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%')::integer AS female_count,
    COUNT(h.id) FILTER (
        WHERE h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) <= 6
    )::integer AS young_count,
    COUNT(h.id) FILTER (
        WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%'
        AND h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) BETWEEN 3 AND 18
    )::integer AS active_mare_count,
    COUNT(DISTINCT h.owner_id) FILTER (WHERE h.owner_id IS NOT NULL)::integer AS connected_owner_count,
    ROUND(AVG(COALESCE(h.data_quality_score, 0))::numeric, 1) AS avg_quality,
    MAX(h.birth_year)::integer AS latest_birth_year
FROM studbook_horses h
JOIN studbook_people_orgs breeder ON breeder.id = h.breeder_id
WHERE is_actionable_studbook_name(breeder.name)
GROUP BY breeder.id, breeder.name;

CREATE OR REPLACE VIEW studbook_owner_rankings AS
SELECT
    owner.id::text AS entity_id,
    'owner'::text AS entity_kind,
    owner.name,
    COUNT(h.id)::integer AS horse_count,
    COUNT(h.id) FILTER (WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%')::integer AS female_count,
    COUNT(h.id) FILTER (
        WHERE h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) <= 6
    )::integer AS young_count,
    COUNT(h.id) FILTER (
        WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%'
        AND h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) BETWEEN 3 AND 18
    )::integer AS active_mare_count,
    COUNT(DISTINCT h.breeder_id) FILTER (WHERE h.breeder_id IS NOT NULL)::integer AS connected_owner_count,
    ROUND(AVG(COALESCE(h.data_quality_score, 0))::numeric, 1) AS avg_quality,
    MAX(h.birth_year)::integer AS latest_birth_year
FROM studbook_horses h
JOIN studbook_people_orgs owner ON owner.id = h.owner_id
WHERE is_actionable_studbook_name(owner.name)
GROUP BY owner.id, owner.name;

CREATE OR REPLACE VIEW studbook_sire_rankings AS
SELECT
    LOWER(TRIM(h.sire_name)) AS entity_id,
    'sire'::text AS entity_kind,
    MIN(TRIM(h.sire_name)) AS name,
    COUNT(h.id)::integer AS horse_count,
    COUNT(h.id) FILTER (WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%')::integer AS female_count,
    COUNT(h.id) FILTER (
        WHERE h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) <= 6
    )::integer AS young_count,
    COUNT(h.id) FILTER (
        WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%'
        AND h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) BETWEEN 3 AND 18
    )::integer AS active_mare_count,
    COUNT(DISTINCT h.owner_id) FILTER (WHERE h.owner_id IS NOT NULL)::integer AS connected_owner_count,
    ROUND(AVG(COALESCE(h.data_quality_score, 0))::numeric, 1) AS avg_quality,
    MAX(h.birth_year)::integer AS latest_birth_year
FROM studbook_horses h
WHERE is_actionable_studbook_name(h.sire_name)
GROUP BY LOWER(TRIM(h.sire_name));

CREATE OR REPLACE VIEW studbook_dam_rankings AS
SELECT
    LOWER(TRIM(h.dam_name)) AS entity_id,
    'dam'::text AS entity_kind,
    MIN(TRIM(h.dam_name)) AS name,
    COUNT(h.id)::integer AS horse_count,
    COUNT(h.id) FILTER (WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%')::integer AS female_count,
    COUNT(h.id) FILTER (
        WHERE h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) <= 6
    )::integer AS young_count,
    COUNT(h.id) FILTER (
        WHERE LOWER(COALESCE(h.sex, '')) LIKE '%f%'
        AND h.birth_date IS NOT NULL
        AND DATE_PART('year', AGE(CURRENT_DATE, h.birth_date)) BETWEEN 3 AND 18
    )::integer AS active_mare_count,
    COUNT(DISTINCT h.owner_id) FILTER (WHERE h.owner_id IS NOT NULL)::integer AS connected_owner_count,
    ROUND(AVG(COALESCE(h.data_quality_score, 0))::numeric, 1) AS avg_quality,
    MAX(h.birth_year)::integer AS latest_birth_year
FROM studbook_horses h
WHERE is_actionable_studbook_name(h.dam_name)
GROUP BY LOWER(TRIM(h.dam_name));

GRANT SELECT ON studbook_breeder_rankings TO authenticated;
GRANT SELECT ON studbook_owner_rankings TO authenticated;
GRANT SELECT ON studbook_sire_rankings TO authenticated;
GRANT SELECT ON studbook_dam_rankings TO authenticated;
GRANT SELECT ON studbook_breeder_rankings TO anon;
GRANT SELECT ON studbook_owner_rankings TO anon;
GRANT SELECT ON studbook_sire_rankings TO anon;
GRANT SELECT ON studbook_dam_rankings TO anon;

DROP POLICY IF EXISTS "Allow anon test access auction_candidate_lists"
ON auction_candidate_lists;

CREATE POLICY "Allow anon test access auction_candidate_lists"
ON auction_candidate_lists FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon test access auction_candidate_items"
ON auction_candidate_items;

CREATE POLICY "Allow anon test access auction_candidate_items"
ON auction_candidate_items FOR ALL TO anon USING (true) WITH CHECK (true);
