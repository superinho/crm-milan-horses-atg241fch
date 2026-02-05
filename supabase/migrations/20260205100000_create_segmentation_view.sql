-- Create a view to calculate contact segments dynamically
CREATE OR REPLACE VIEW contact_segmentation_view AS
WITH purchase_stats AS (
    SELECT 
        contact_id, 
        COUNT(*) as purchase_count, 
        SUM(value) as total_value
    FROM purchases
    GROUP BY contact_id
),
bid_stats AS (
    SELECT 
        contact_id, 
        COUNT(DISTINCT auction_id) as distinct_auctions, 
        MAX(date) as last_bid_date
    FROM bids
    GROUP BY contact_id
)
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.created_at,
    COALESCE(p.purchase_count, 0) as purchase_count,
    COALESCE(p.total_value, 0) as total_purchase_value,
    COALESCE(b.distinct_auctions, 0) as distinct_auctions_bid,
    b.last_bid_date,
    CASE 
        WHEN (COALESCE(p.total_value, 0) > 500000 OR COALESCE(p.purchase_count, 0) >= 5) THEN 'VIP'
        WHEN (COALESCE(p.purchase_count, 0) BETWEEN 2 AND 4 OR COALESCE(b.distinct_auctions, 0) >= 3) THEN 'Frequentes'
        WHEN (c.created_at > (NOW() - INTERVAL '30 days') AND COALESCE(p.purchase_count, 0) = 0) THEN 'Novos Leads'
        WHEN (b.last_bid_date >= (CURRENT_DATE - INTERVAL '90 days')) THEN 'Ativos'
        WHEN (b.last_bid_date < (CURRENT_DATE - INTERVAL '90 days')) THEN 'Inativos'
        ELSE 'Sem Segmento'
    END as segment
FROM contacts c
LEFT JOIN purchase_stats p ON c.id = p.contact_id
LEFT JOIN bid_stats b ON c.id = b.contact_id;

-- Grant access to the view
GRANT SELECT ON contact_segmentation_view TO authenticated;
