# Veni Supabase migration continuity

## Staging database migration history currently recorded

- `20260903071048_revoke_handle_new_user_rpc_access`
- `20260903072229_arcana_stage3_pilot_foundation`

## Pre-history manual baseline

`supabase/migrations/20260903_001_veni_account_foundation.sql` created the Stage 2 account schema manually before migration-history tracking was properly established.

It is intentionally retained during Stage 3.2 because it is the only complete replayable source for:
- profiles
- products
- entitlements
- profile bootstrap trigger
- initial RLS policies

Do not automatically replay or rename it against staging without first repairing/establishing a clean migration baseline.

## Duplicate to remove

Delete:
`supabase/migrations/20260903_002_revoke_handle_new_user_rpc_access.sql`

Keep:
`supabase/migrations/20260903071048_revoke_handle_new_user_rpc_access.sql`

The duplicate could not be deleted through the ChatGPT GitHub integration because the integration still receives a 403 for Contents API writes.

## Stage 4 production rule

Before creating the production Supabase project, create a clean canonical baseline from the verified staging schema and migration history. Do not point production automation at this mixed early-history folder until that baseline exercise is complete.
