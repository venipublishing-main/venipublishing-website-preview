# Veni Publishing — Stage 2 Account Foundation (v2.2)

Target: preview repo only.

Implemented:
- /account/
- /account/sign-in/
- /account/register/
- /account/library/
- /account/settings/
- Supabase Auth browser integration
- session persistence/sign-out
- minimal profile updates
- RLS-backed library entitlements
- staging-safe unconfigured state
- SQL migration for profiles/products/entitlements

Not implemented:
- payments
- subscriptions
- Arcana credits
- premium Mythos charging
- BUZA role/profile data

Security:
- no service-role key
- no client write policy for entitlements
- profiles restricted to their owner
- Veni Kids routes untouched
