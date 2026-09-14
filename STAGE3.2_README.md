# Veni Publishing — Stage 3.2 Account Lifecycle & Hardening

Target: preview repository only.

Backend already deployed to Veni staging:
- Edge Function `delete-account`
- JWT verification enabled
- function deletes only the authenticated caller
- service-role key remains inside Supabase runtime environment

Front-end additions:
- `/account/forgot-password/`
- `/account/reset-password/`
- existing display name now preloads into Settings
- email-change request flow
- Settings & Security restructuring
- permanent account deletion with typed confirmation and final browser confirmation
- clearer signed-in `My Account` label on Account pages
- updated preview Privacy Notice and Terms
- existing Library / Arcana tool linkage retained

Account deletion currently cascades through auth-user foreign keys to:
- profile
- entitlements
- Arcana readings
- Arcana reading-card links
- Arcana journal entries

No payment/subscription records exist yet.

Migration history:
- keep `20260903_001_veni_account_foundation.sql` as a documented manual baseline for now
- delete the obsolete duplicate `20260903_002_revoke_handle_new_user_rpc_access.sql`
- keep the exact tracked `20260903071048...` and `20260903072229...` migrations
- establish a clean canonical production baseline during Stage 4

Recommended preview validation:
1. Request a password-reset email and complete the reset.
2. Confirm Settings preloads the existing display name and email.
3. Request an email change using a test account.
4. Create a disposable test account, save one Arcana reading/note, then delete that account from Settings.
5. Confirm the deleted account can no longer sign in and its private Arcana/profile rows have cascaded away.
