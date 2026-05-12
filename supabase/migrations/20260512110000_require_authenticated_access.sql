-- Lock the CRM data behind Supabase Auth now that the app has a login screen.
-- The authenticated policies remain in place for internal users.

DROP POLICY IF EXISTS "Allow anon test access contacts" ON contacts;
DROP POLICY IF EXISTS "Allow anon test access companies" ON companies;
DROP POLICY IF EXISTS "Allow anon test access interactions" ON contact_interactions;
DROP POLICY IF EXISTS "Allow anon test access purchases" ON purchases;
DROP POLICY IF EXISTS "Allow anon test access tags" ON tags;
DROP POLICY IF EXISTS "Allow anon test access contact_tags" ON contact_tags;
DROP POLICY IF EXISTS "Allow anon test access bids" ON bids;
DROP POLICY IF EXISTS "Allow anon test access deals" ON deals;
DROP POLICY IF EXISTS "Allow anon test access deal_tasks" ON deal_tasks;
DROP POLICY IF EXISTS "Allow anon test access tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anon test access campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow anon test access campaign_schedules" ON campaign_schedules;
DROP POLICY IF EXISTS "Allow anon test access campaign_recipients" ON campaign_recipients;
DROP POLICY IF EXISTS "Allow anon test access campaign_sends" ON campaign_sends;
DROP POLICY IF EXISTS "Allow anon test access outbound_messages" ON outbound_messages;
DROP POLICY IF EXISTS "Allow anon test access message_events" ON message_events;
DROP POLICY IF EXISTS "Allow anon test access message_templates" ON message_templates;
DROP POLICY IF EXISTS "Allow anon test access smartleiloes_auctions" ON smartleiloes_auctions;
DROP POLICY IF EXISTS "Allow anon test access smartleiloes_lots" ON smartleiloes_lots;
DROP POLICY IF EXISTS "Allow anon read smartleiloes_raw_records" ON smartleiloes_raw_records;
DROP POLICY IF EXISTS "Allow anon read smartleiloes_sync_runs" ON smartleiloes_sync_runs;

REVOKE SELECT ON customer_rfmv_view FROM anon;
