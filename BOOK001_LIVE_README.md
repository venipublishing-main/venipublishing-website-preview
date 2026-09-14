# Veni Publishing — Stage 3.2 Catch-up + Book 001 LIVE Release Pass

This is a **combined preview patch** because the prior Stage 3.2 front-end patch was not present in the preview repository when checked on 13 September 2026.

It includes:
- the full Stage 3.2 Account Lifecycle & Hardening front-end package;
- the Book 001 LIVE release pass;
- current preview Privacy/Terms updates from Stage 3.2;
- Supabase Edge Function source mirror for `delete-account`.

## Book 001 now live

**South African Animals & Biomes: A Colouring Adventure**

Amazon:
https://www.amazon.com/dp/1048338150

Permanent QR destination (unchanged):
https://venipublishing.co.za/kids/

### Updated surfaces

- `/`
- `/platforms/`
- `/releases/`
- `/kids/`
- `/kids/books/`
- `/kids/animals/`
- `/kids/freebies/`

### Book-page behaviour

- Paperback status = Available now.
- Amazon CTA opens in a new tab with `rel="noopener noreferrer"`.
- Free book extras link points to `/kids/freebies/`.
- Printable PDF remains described only as planned/not currently available.
- Book structured data keeps the canonical Veni book-page URL and adds Amazon as the purchase Offer URL.

### Free resources

The freebies page explicitly connects the resources to Book 001 and retains the truthful "Downloads are being prepared" wording.
No personal details are required to access free resources.

## Stage 3.2 reminder

The `delete-account` Edge Function is already deployed to Veni staging Supabase from the earlier Stage 3.2 backend pass.

After uploading this combined patch, please also delete this obsolete duplicate migration from the repo:

`supabase/migrations/20260903_002_revoke_handle_new_user_rpc_access.sql`

Keep:

`supabase/migrations/20260903071048_revoke_handle_new_user_rpc_access.sql`

## Deployment target

Preview repository only:
`venipublishing-main/venipublishing-website-preview`

Production remains unchanged until preview QA is accepted.
