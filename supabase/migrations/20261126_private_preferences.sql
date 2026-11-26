-- Make preferences private.
--
-- Before: the SELECT policy on preferences was USING (true), so anyone holding
-- the public anon key could read every member's budget and preferences.
-- After: a member can only read their own row.
--
-- The leader's server routes (synthesize, recommend-locations, generate-itinerary)
-- now read everyone's preferences through the service role key, which bypasses
-- row level security. SUPABASE_SERVICE_ROLE_KEY must be set on the server.
--
-- Run this once in the Supabase SQL editor. It is safe to run again.

-- Drop every existing SELECT policy on preferences, whatever it was named.
-- INSERT and UPDATE policies are left alone.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'preferences'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.preferences', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view own preferences" ON public.preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Check afterwards: this should list exactly one SELECT policy for preferences,
-- plus the existing INSERT and UPDATE policies. A policy with cmd = 'ALL' would
-- still allow reads and should be removed by hand.
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'preferences';
