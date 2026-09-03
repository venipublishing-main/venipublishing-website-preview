# Veni Account Stage 2 — Supabase

Apply the migration to a dedicated Veni STAGING project first.

Authentication:
- Email/password enabled.
- Email confirmation recommended.
- Site URL: the GitHub Pages preview/staging URL.
- Add account confirmation/redirect routes.
- Never place a service-role or secret key in GitHub Pages.

Browser config:
Copy `assets/js/supabase-config.js.example` to `assets/js/supabase-config.js`
and add ONLY the project URL and a publishable key.

The database model is deliberately small:
- profiles: minimal shared identity
- products: entitlement catalog
- entitlements: private per-user access

No payments, subscriptions, Arcana credits, journals, or BUZA learner/tutor data are included in Stage 2.
