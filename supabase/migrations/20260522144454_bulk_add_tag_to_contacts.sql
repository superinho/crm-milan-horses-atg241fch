CREATE OR REPLACE FUNCTION public.bulk_add_tag_to_contacts(
  p_contact_ids uuid[],
  p_tag_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.contact_tags (contact_id, tag_id)
  SELECT unnest(p_contact_ids), p_tag_id
  ON CONFLICT (contact_id, tag_id) DO NOTHING;
END;
$function$;
