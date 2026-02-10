-- Rename scheduled_at to scheduled_date to match requirements in campaign_schedules
ALTER TABLE campaign_schedules RENAME COLUMN scheduled_at TO scheduled_date;

-- Ensure RLS is enabled for security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state and correct permissions
DROP POLICY IF EXISTS "Allow authenticated full access campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow authenticated full access campaign_schedules" ON campaign_schedules;
-- Clean up potential old policy names
DROP POLICY IF EXISTS "Allow authenticated full access campaign_sends" ON campaign_schedules;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow authenticated full access campaigns" 
ON campaigns 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated full access campaign_schedules" 
ON campaign_schedules 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
