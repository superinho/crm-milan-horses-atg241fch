-- Filter-aware Studbook network rankings for prospecting workflows.

CREATE OR REPLACE FUNCTION normalize_studbook_match_name(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT REGEXP_REPLACE(LOWER(TRIM(COALESCE(value, ''))), '[^a-z0-9]+', ' ', 'g');
$$;

CREATE OR REPLACE FUNCTION get_studbook_network_rankings(
    p_search TEXT DEFAULT NULL,
    p_sex TEXT DEFAULT 'all',
    p_min_age INTEGER DEFAULT NULL,
    p_max_age INTEGER DEFAULT NULL,
    p_include_unknown_age BOOLEAN DEFAULT TRUE,
    p_reproductive_only BOOLEAN DEFAULT FALSE,
    p_breeder_names TEXT[] DEFAULT NULL,
    p_owner_names TEXT[] DEFAULT NULL,
    p_sire_names TEXT[] DEFAULT NULL,
    p_dam_names TEXT[] DEFAULT NULL,
    p_min_offspring INTEGER DEFAULT NULL,
    p_data_quality_min INTEGER DEFAULT NULL,
    p_recent_years INTEGER DEFAULT NULL,
    p_rank_mode TEXT DEFAULT 'volume',
    p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
    entity_id TEXT,
    entity_kind TEXT,
    name TEXT,
    horse_count INTEGER,
    female_count INTEGER,
    young_count INTEGER,
    active_mare_count INTEGER,
    connected_owner_count INTEGER,
    avg_quality NUMERIC,
    latest_birth_year INTEGER,
    recent_horse_count INTEGER,
    crm_contact_count INTEGER,
    total_entities INTEGER
)
LANGUAGE SQL
STABLE
AS $$
WITH filtered AS (
    SELECT *
    FROM studbook_horses_enriched h
    WHERE (
        NULLIF(TRIM(COALESCE(p_search, '')), '') IS NULL
        OR h.name ILIKE '%' || p_search || '%'
        OR h.registration ILIKE '%' || p_search || '%'
        OR h.original_registration ILIKE '%' || p_search || '%'
        OR h.ueln ILIKE '%' || p_search || '%'
        OR h.microchip ILIKE '%' || p_search || '%'
        OR h.breeder_name ILIKE '%' || p_search || '%'
        OR h.owner_name ILIKE '%' || p_search || '%'
        OR h.sire_name ILIKE '%' || p_search || '%'
        OR h.dam_name ILIKE '%' || p_search || '%'
    )
    AND (
        COALESCE(p_sex, 'all') = 'all'
        OR (
            p_sex = 'female'
            AND (
                h.sex = 'F'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%femea%'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%fêmea%'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%egua%'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%égua%'
            )
        )
        OR (
            p_sex = 'male'
            AND (
                h.sex = 'M'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%macho%'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%garanhao%'
                OR LOWER(COALESCE(h.sex, '')) LIKE '%garanhão%'
            )
        )
        OR (
            p_sex = 'gelding'
            AND LOWER(COALESCE(h.sex, '')) LIKE '%castrad%'
        )
    )
    AND (
        COALESCE(p_include_unknown_age, TRUE)
        OR h.age_years IS NOT NULL
    )
    AND (
        COALESCE(p_include_unknown_age, TRUE)
        OR p_min_age IS NULL
        OR h.age_years >= p_min_age
    )
    AND (
        COALESCE(p_include_unknown_age, TRUE)
        OR p_max_age IS NULL
        OR h.age_years <= p_max_age
    )
    AND (
        COALESCE(p_reproductive_only, FALSE) = FALSE
        OR h.is_reproductive_mare = TRUE
    )
    AND (
        p_breeder_names IS NULL
        OR CARDINALITY(p_breeder_names) = 0
        OR h.breeder_name = ANY(p_breeder_names)
    )
    AND (
        p_owner_names IS NULL
        OR CARDINALITY(p_owner_names) = 0
        OR h.owner_name = ANY(p_owner_names)
    )
    AND (
        p_sire_names IS NULL
        OR CARDINALITY(p_sire_names) = 0
        OR h.sire_name = ANY(p_sire_names)
    )
    AND (
        p_dam_names IS NULL
        OR CARDINALITY(p_dam_names) = 0
        OR h.dam_name = ANY(p_dam_names)
    )
    AND (
        p_min_offspring IS NULL
        OR p_min_offspring <= 0
        OR h.offspring_count >= p_min_offspring
    )
    AND (
        p_data_quality_min IS NULL
        OR p_data_quality_min <= 0
        OR h.data_quality_score >= p_data_quality_min
    )
    AND (
        p_recent_years IS NULL
        OR p_recent_years <= 0
        OR h.birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - p_recent_years + 1
    )
),
entities AS (
    SELECT
        breeder_id::text AS entity_id,
        'breeder'::text AS entity_kind,
        breeder_name AS name,
        COUNT(*)::integer AS horse_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
        COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
        COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
        COUNT(DISTINCT owner_name) FILTER (WHERE owner_name IS NOT NULL)::integer AS connected_owner_count,
        ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
        MAX(birth_year)::integer AS latest_birth_year,
        COUNT(*) FILTER (
            WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
        )::integer AS recent_horse_count
    FROM filtered
    WHERE is_actionable_studbook_name(breeder_name)
    GROUP BY breeder_id, breeder_name

    UNION ALL

    SELECT
        owner_id::text AS entity_id,
        'owner'::text AS entity_kind,
        owner_name AS name,
        COUNT(*)::integer AS horse_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
        COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
        COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
        COUNT(DISTINCT breeder_name) FILTER (WHERE breeder_name IS NOT NULL)::integer AS connected_owner_count,
        ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
        MAX(birth_year)::integer AS latest_birth_year,
        COUNT(*) FILTER (
            WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
        )::integer AS recent_horse_count
    FROM filtered
    WHERE is_actionable_studbook_name(owner_name)
    GROUP BY owner_id, owner_name

    UNION ALL

    SELECT
        LOWER(TRIM(sire_name)) AS entity_id,
        'sire'::text AS entity_kind,
        MIN(TRIM(sire_name)) AS name,
        COUNT(*)::integer AS horse_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
        COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
        COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
        COUNT(DISTINCT owner_name) FILTER (WHERE owner_name IS NOT NULL)::integer AS connected_owner_count,
        ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
        MAX(birth_year)::integer AS latest_birth_year,
        COUNT(*) FILTER (
            WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
        )::integer AS recent_horse_count
    FROM filtered
    WHERE is_actionable_studbook_name(sire_name)
    GROUP BY LOWER(TRIM(sire_name))

    UNION ALL

    SELECT
        LOWER(TRIM(dam_name)) AS entity_id,
        'dam'::text AS entity_kind,
        MIN(TRIM(dam_name)) AS name,
        COUNT(*)::integer AS horse_count,
        COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
        COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
        COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
        COUNT(DISTINCT owner_name) FILTER (WHERE owner_name IS NOT NULL)::integer AS connected_owner_count,
        ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
        MAX(birth_year)::integer AS latest_birth_year,
        COUNT(*) FILTER (
            WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
        )::integer AS recent_horse_count
    FROM filtered
    WHERE is_actionable_studbook_name(dam_name)
    GROUP BY LOWER(TRIM(dam_name))
),
with_crm AS (
    SELECT
        e.*,
        COALESCE(c.crm_contact_count, 0)::integer AS crm_contact_count,
        COUNT(*) OVER (PARTITION BY e.entity_kind)::integer AS total_entities,
        ROW_NUMBER() OVER (
            PARTITION BY e.entity_kind
            ORDER BY
                CASE WHEN COALESCE(p_rank_mode, 'volume') = 'recent' THEN e.recent_horse_count ELSE e.horse_count END DESC,
                e.latest_birth_year DESC NULLS LAST,
                e.horse_count DESC,
                e.name ASC
        ) AS rank_position
    FROM entities e
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS crm_contact_count
        FROM contacts c
        WHERE normalize_studbook_match_name(c.name) = normalize_studbook_match_name(e.name)
    ) c ON TRUE
)
SELECT
    entity_id,
    entity_kind,
    name,
    horse_count,
    female_count,
    young_count,
    active_mare_count,
    connected_owner_count,
    avg_quality,
    latest_birth_year,
    recent_horse_count,
    crm_contact_count,
    total_entities
FROM with_crm
WHERE rank_position <= LEAST(GREATEST(COALESCE(p_limit, 6), 1), 20)
ORDER BY entity_kind, rank_position;
$$;

GRANT EXECUTE ON FUNCTION get_studbook_network_rankings(
    TEXT,
    TEXT,
    INTEGER,
    INTEGER,
    BOOLEAN,
    BOOLEAN,
    TEXT[],
    TEXT[],
    TEXT[],
    TEXT[],
    INTEGER,
    INTEGER,
    INTEGER,
    TEXT,
    INTEGER
) TO authenticated;

GRANT EXECUTE ON FUNCTION get_studbook_network_rankings(
    TEXT,
    TEXT,
    INTEGER,
    INTEGER,
    BOOLEAN,
    BOOLEAN,
    TEXT[],
    TEXT[],
    TEXT[],
    TEXT[],
    INTEGER,
    INTEGER,
    INTEGER,
    TEXT,
    INTEGER
) TO anon;
