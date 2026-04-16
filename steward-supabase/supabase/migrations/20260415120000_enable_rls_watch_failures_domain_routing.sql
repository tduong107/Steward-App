-- Fix Security Advisor errors: RLS Disabled in Public
-- Both tables are server-side only (edge functions via service_role).
-- Enabling RLS with a service_role-only policy blocks all anon/
-- authenticated client access while service_role bypasses RLS.

ALTER TABLE public.watch_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages watch_failures"
  ON public.watch_failures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.domain_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages domain_routing"
  ON public.domain_routing
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
