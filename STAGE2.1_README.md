# Veni Publishing — Stage 2.1 Security Hardening

Upload this patch to the preview repository root.

Adds:
- `supabase/migrations/20260903_002_revoke_handle_new_user_rpc_access.sql`

Purpose:
- Reproduce the Supabase Security Advisor fix already applied directly to staging.
- Prevent anonymous or signed-in users from directly calling the `SECURITY DEFINER` profile bootstrap function through RPC.

No public-site files are changed.
No production files are changed.
The deferred account-linkage audit is tracked in the Google Drive continuity log.
