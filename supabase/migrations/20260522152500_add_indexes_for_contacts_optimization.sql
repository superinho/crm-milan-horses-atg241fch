DO $$
BEGIN
  -- Add indexes to improve performance of customer_rfmv_view and large fetches
  CREATE INDEX IF NOT EXISTS idx_purchases_contact_id ON public.purchases USING btree (contact_id);
  CREATE INDEX IF NOT EXISTS idx_bids_contact_id ON public.bids USING btree (contact_id);
  
  -- Add indexes for contact tags to speed up tag filtering
  CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON public.contact_tags USING btree (contact_id);
  CREATE INDEX IF NOT EXISTS idx_contact_tags_tag_id ON public.contact_tags USING btree (tag_id);

  -- Index on contacts.created_at for sorting
  CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts USING btree (created_at DESC);
END $$;
