# Veni Publishing — Stage 3 Arcana Pilot (v3.0)

Target: `venipublishing-main/venipublishing-website-preview`

## What this implements

Public:
- `/arcana/draw/`
- free single-card draw
- optional focus/question
- six explicitly labelled pilot card interpretations
- no account required to draw
- no question is stored unless the user deliberately saves the reading

Veni Account:
- `/arcana/readings/`
- `/arcana/journal/`
- save a single-card reading
- optional private journal note
- post-auth return to the draw page

Database:
- `arcana_cards`
- `arcana_readings`
- `arcana_reading_cards`
- `arcana_journal_entries`
- Row Level Security on all four tables
- authenticated-only `save_arcana_single_card_reading(...)` RPC
- six pilot Major Arcana rows for mechanics testing

## Important content boundary

The six interpretations in this pilot are **temporary pilot copy**.
They are not the canonical public wording for Tarot of the African South.
A later content-integration pass must replace them with approved extracts derived from the completed Veni Arcana dossiers.

## Monetisation boundary

No credits, subscriptions, payments, quotas, premium spreads or paid interpretations are included.
Stage 3 proves:
1. public interaction,
2. identity,
3. private persistence,
4. private journaling,
5. safe return after authentication.

## Security

The migration has already been applied to the Veni staging Supabase project.
Security Advisor after migration reports no new database/RLS warnings; only the existing plan-level leaked-password-protection warning remains.

## Migration-history reconciliation

The Veni staging database already records these exact migration versions:

- `20260903071048_revoke_handle_new_user_rpc_access`
- `20260903072229_arcana_stage3_pilot_foundation`

This patch therefore includes files with those exact version prefixes so Git and Supabase stay aligned.

If the preview repository still contains the earlier manually named file:

`supabase/migrations/20260903_002_revoke_handle_new_user_rpc_access.sql`

delete that older duplicate after uploading this patch. Keep the exact-version file above instead.
