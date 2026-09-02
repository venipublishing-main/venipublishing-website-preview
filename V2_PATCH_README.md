# Veni Publishing Website v2 — preview patch

This patch is designed for:

`venipublishing-main/venipublishing-website-preview`

It is **not** a complete replacement repository. It contains only new or changed files for the v2 architecture pass.

## What changes

- Expands the parent architecture from five to six platforms.
- Adds **Veni Arcana** as a top-level platform.
- Adds a provisional `/arcana/` platform page.
- Adds a non-functional `/account/` architecture preview for the planned **Veni Account** layer.
- Updates the homepage, Platforms, About and Releases pages.
- Adds `assets/css/v2.css` as a low-risk override layer on top of the existing stylesheet.
- Adds a deliberately provisional `arcana-placeholder.svg`.
- Updates the sitemap and file-tree record.
- Preserves `/kids/` and all existing Veni Kids routes unchanged.

## Important

No authentication, payment processing, database connection or protected-content logic is implemented in this patch.

The preview pages remain `noindex, nofollow`.

## Apply

Upload the **contents** of this patch into the matching paths of the preview repository, replacing files with the same names.

The GitHub connector available in this chat could read the repository but returned HTTP 403 on write attempts, so this patch was generated for direct application to the preview repository instead of silently claiming that the repo was updated.

## Review priorities

1. Homepage six-platform balance and mobile orbit.
2. Veni Arcana wording and provisional visual treatment.
3. Veni Account placement in the parent navigation.
4. Whether the account architecture feels too prominent before authentication exists.
5. Arcana access-tier language before any pricing is designed.
