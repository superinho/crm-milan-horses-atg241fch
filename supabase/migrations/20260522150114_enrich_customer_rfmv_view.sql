CREATE OR REPLACE VIEW public.customer_rfmv_extended_view AS
SELECT 
    v.*,
    c.preferences,
    ARRAY(SELECT ct.tag_id FROM public.contact_tags ct WHERE ct.contact_id = v.id) AS tag_ids
FROM public.customer_rfmv_view v
JOIN public.contacts c ON c.id = v.id;
