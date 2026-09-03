-- Veni Publishing — Stage 2.1 security hardening
-- Prevent direct RPC execution of the SECURITY DEFINER profile bootstrap function.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
