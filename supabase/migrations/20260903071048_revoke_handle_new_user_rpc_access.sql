-- Veni Publishing — Stage 2.1 security hardening
-- This filename matches the migration version already recorded in Supabase staging.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
