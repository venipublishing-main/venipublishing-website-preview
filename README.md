# Veni Publishing Website — Redesign v1

This is a static GitHub Pages build for `venipublishing.co.za`.

## Protected route

The permanent Veni Kids QR destination is:

`https://venipublishing.co.za/kids/`

Do not remove, rename or redirect that route away from a useful Veni Kids homepage.

## Main structure

- `/` — Veni Publishing
- `/platforms/` — ecosystem overview
- `/kids/` — Veni Kids permanent homepage
- `/kids/animals/` — South African Animals & Biomes
- `/ai-geopolitic/`
- `/faithful/`
- `/mythos/`
- `/mythos/version-0-9/`
- `/buza/`
- `/privacy/`
- `/terms/`

## Before publishing

1. Back up the current repository.
2. Create a branch such as `redesign-v1`.
3. Upload this package to that branch.
4. Test through a preview repository or local web server.
5. Confirm the custom domain remains `venipublishing.co.za`.
6. Confirm HTTPS remains enforced.
7. Scan the printed QR code and verify `/kids/`.
8. Add the confirmed public contact email.
9. Add Amazon, Payhip and sample-download links only after they are active.
10. Replace the Version 0.9 Instagram placeholder when the public account URL is confirmed.

## Editing content

All pages use plain HTML. Shared styling is in:

`assets/css/site.css`

Mobile navigation is in:

`assets/js/site.js`

Images are in:

`assets/images/`

## Adding a new book

1. Copy `/kids/animals/` into a new short route, e.g. `/kids/birds/`.
2. Replace title, description, metadata and images.
3. Add the book to `/kids/books/`, `/releases/` and `sitemap.xml`.
4. Keep `/kids/` unchanged as the permanent imprint landing page.

## Adding a Veni Mythos series

1. Create `/mythos/<series-name>/`.
2. Add the series to `/mythos/`, `/releases/` and `sitemap.xml`.
3. Keep the Veni Mythos page platform-level; individual worlds and series sit below it.

## Rollback

If the live deployment fails, restore the previous `main` commit or merge the backup branch created before deployment.

## Privacy

No analytics, advertising scripts, child accounts, comments or data-entry forms are included in this build.
