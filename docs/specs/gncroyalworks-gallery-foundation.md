# GNCRoyalWorks Gallery Foundation Spec

## Summary

GNCRoyalWorks is a non-commerce gallery for finished handmade leatherwork. Visitors should browse completed pieces, see a handful highlighted on the homepage, filter the broader gallery by item type, and leave the site for Etsy to ask questions, check availability, or buy.

This implementation uses the current dev site as directional reference, but replaces the generic portfolio starter with a leatherwork-specific EmDash content model and public route structure.

## Key Changes

- CMS collection is `pieces`, labeled `Finished Pieces` / `Finished Piece`.
- Public gallery routes are `/finished-work` and `/finished-work/[slug]`.
- Public navigation is Home, Finished Work, and Etsy Shop.
- The local contact form is removed; contact and custom-work paths redirect to Etsy.
- Starter portfolio concepts like `projects`, `/work`, client, and design-studio copy are removed from user-facing pages.

## Content Model

`pieces` supports drafts, revisions, search, and SEO.

Fields:

- `title` string, required, searchable
- `featured_image` image, required
- `summary` text, searchable
- `content` portableText, searchable
- `featured` boolean
- `materials`, `color`, `dimensions` string fields
- `personalization_note` text
- `availability_note` string
- `etsy_url` url, optional with fallback to the site-wide shop URL

Taxonomies:

- `category` hierarchical taxonomy attached to `pieces`: Rifle Slings, Belts, Sheaths, Cartridge Holders, Accessories, Other
- `tag` flat taxonomy attached to `pieces`: Tooled, Floral, Personalized, Two-tone, Western, Hunting, Ranch, Gift

Categories and tags are managed through EmDash taxonomy sidebar controls, then rendered from taxonomy assignments on public cards, filters, and detail pages.

The `pages` collection remains for editable Home and Finished Work page copy.

## Public Pages

- Home queries featured `pieces`, falling back to latest pieces when nothing is featured.
- Finished Work lists all pieces, supports category filtering, and displays tags on cards.
- Finished Work detail shows the CMS image, category, summary, optional fact list, tags, rich body copy, and Etsy CTA.
- `/work`, `/work/[slug]`, `/about`, `/contact`, and `/custom-work` redirect instead of maintaining old starter surfaces.

## Acceptance Tests

- `npx emdash types` regenerates collection types.
- `pnpm run typecheck` passes.
- `pnpm run build` passes.
- `/`, `/finished-work`, and `/finished-work/floral-tooled-rifle-sling` render.
- Optional fields can be blank without broken layout.
- No user-facing portfolio starter copy remains.
