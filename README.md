# GNCRoyalWorks

A quiet gallery site for finished handmade leatherwork from GNCRoyalWorks in Katy, Texas.

The site is meant to show completed pieces clearly and send purchase or custom-work conversations to Etsy. It is not a local store, cart, or inquiry system.

## What Is Here

- A home page with editable intro copy and a small featured set of finished pieces.
- A finished-work gallery at `/finished-work`, with category filters.
- Detail pages for individual pieces at `/finished-work/:slug`.
- Simple redirects from older or intent-based paths like `/work`, `/contact`, and `/custom-work`.
- RSS, SEO basics, dark/light mode, and EmDash visual editing.

Content lives in EmDash:

- `pieces` are finished leather pieces with one featured image, summary, optional materials/color/dimensions, featured flag, and featured order.
- `category` and `tag` are taxonomy assignments on pieces.
- `pages` holds editable copy for the home page, gallery page, and related-work text.
- The primary menu points to Home, Finished Work, and the Etsy shop.

## Work Locally

```bash
pnpm install
pnpm dev
```

The admin area is available at `/_emdash/admin` on the local dev URL.

Useful checks:

```bash
pnpm typecheck
pnpm build
```

## Deploy

```bash
pnpm deploy
```

Deploying updates the Cloudflare Worker code. Existing production content and schema live in the production EmDash database, so content-model changes should be made there intentionally and then reflected back in `seed/seed.json`.
