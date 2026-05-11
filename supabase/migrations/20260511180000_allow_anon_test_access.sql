-- Temporary test access for the Milan Horses CRM while validating the MVP.
-- Remove or tighten these policies before production.

CREATE POLICY "Allow anon test access contacts" ON contacts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access companies" ON companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access interactions" ON contact_interactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access purchases" ON purchases FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access tags" ON tags FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access contact_tags" ON contact_tags FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access bids" ON bids FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access deals" ON deals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access deal_tasks" ON deal_tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access tasks" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaigns" ON campaigns FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaign_schedules" ON campaign_schedules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access campaign_sends" ON campaign_sends FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access message_templates" ON message_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access smartleiloes_auctions" ON smartleiloes_auctions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon test access smartleiloes_lots" ON smartleiloes_lots FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read smartleiloes_raw_records" ON smartleiloes_raw_records FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read smartleiloes_sync_runs" ON smartleiloes_sync_runs FOR SELECT TO anon USING (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON customer_rfmv_view TO anon;
