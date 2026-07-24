This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
npx emdash dev        # Start dev server (runs migrations, seeds, generates types)
npx emdash types      # Regenerate TypeScript types from schema
```

The admin UI is at `http://localhost:4321/_emdash/admin`.
If that port is busy, EmDash/Astro will pick the next open port and print the actual admin URL.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                    |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, menus, widgets)             |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/lib/site.ts`        | Site constants such as the Etsy shop URL                                           |
| `src/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions)                 |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behaviour; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are EmDash media objects, not plain strings in normal CMS content. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- Always call `Astro.cache.set(cacheHint)` on pages that query content.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`), if taxonomies are used.

## Local EmDash Gotchas

- EmDash seed content is only auto-applied on first boot when the local database is empty. If the schema changes substantially, back up/reset the local `.wrangler/state/v3/d1` database before expecting new seed content to appear.
- `$media` seed references need network access so EmDash can download the images.
- Avoid using standalone `npx emdash seed` as the default verification path for this Cloudflare/R2 site. It can write downloaded files to local `uploads/` while the running dev site reads media from Miniflare R2, which makes pages render image URLs that 404.
- Prefer verifying seed/media through the running EmDash dev runtime on a fresh local database. If standalone seed is used for debugging, also place generated media files into the local R2 bucket before trusting image smoke tests.
- Astro auto-backgrounds dev servers in agent environments. For stable foreground smoke testing, use `ASTRO_DEV_BACKGROUND=1 pnpm astro dev --port <port> --ignore-lock`.
- `npx emdash types` may omit `ContentBylineCredit`, `TaxonomyTerm`, and the `declare module "emdash"` collection augmentation. After regenerating types, check `emdash-env.d.ts` before running typecheck.

## Production EmDash Workflow

The production site is `https://gncroyalworks-emdash.royal.workers.dev`.

- A deploy updates Worker/template code only. It does not apply `seed/seed.json` to an existing production database.
- For live schema/content model changes, use the EmDash CLI against production, then keep `seed/seed.json` in sync afterward.
- Authenticate with `npx emdash login --url https://gncroyalworks-emdash.royal.workers.dev`, then confirm with `npx emdash whoami --url https://gncroyalworks-emdash.royal.workers.dev`.
- Inspect production schema before editing it: `npx emdash schema get pieces --url https://gncroyalworks-emdash.royal.workers.dev --json`.
- Use `npx emdash schema ... --url https://gncroyalworks-emdash.royal.workers.dev` for schema changes when the CLI supports the needed options.
- If the CLI lacks a flag for a supported field option such as `validation.options`, use the documented schema REST API with the stored CLI token rather than trying to force the seed path.
- After production schema changes, run `npx emdash types --url https://gncroyalworks-emdash.royal.workers.dev -o emdash-env.d.ts`, then check `emdash-env.d.ts` for the known generated-type omissions above.
- For content backfills, read entries with `npx emdash content get <collection> <id> --raw --json --url ...`, use the returned `_rev`, and remember that `content update` auto-publishes unless `--draft` is passed.

## This Template

A gallery for showcasing finished handmade leatherwork. Editorial, restrained, and image-led, with the finished pieces as the main visual interest. This is not ecommerce; purchase/contact intent should leave the site for Etsy.

The design is intentionally restrained. Don't pile on colour, gradients, or decoration -- the work is the decoration.

## Pages

| Page                 | Path                    | What it shows                                                                                  |
| -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Home                 | `/`                     | CMS-editable intro, featured finished pieces, and Etsy CTA                                     |
| Finished Work index  | `/finished-work`        | Heading + CMS copy, category filter chips, full finished-piece grid with tags                  |
| Finished Work detail | `/finished-work/[slug]` | Featured image, category, title, summary, optional facts, tags, Portable Text body, Etsy CTA   |
| Redirects            | `/work`, `/work/[slug]` | Redirect to the matching `/finished-work` route                                                |
| Etsy redirects       | `/contact`, `/custom-work` | Redirect to the Etsy shop instead of maintaining a local inquiry flow                       |
| About redirect       | `/about`                | Redirect to home for v1                                                                        |

## Schema

- `pieces` collection fields: `title`, `featured_image`, `summary`, `content`, `featured`, `materials`, `color`, `dimensions`, `personalization_note`, `availability_note`, `etsy_url`.
- `category` taxonomy: hierarchical, attached to `pieces`, used for item type/category filtering in `/finished-work`.
- `tag` taxonomy: flat, attached to `pieces`, used for piece traits shown on cards/detail pages.
- Piece category/tag values are EmDash taxonomy assignments, not normal entry fields. Read them from `entry.data.terms?.category` / `entry.data.terms?.tag` or `getEntryTerms("pieces", entry.data.id, "category" | "tag")`.
- `pages` collection: `title`, `content` (Portable Text). Used for editable home and finished-work page copy.
- Single `primary` menu.

Site settings have `title` and `tagline` -- both render on the home page (title as the centred serif heading, tagline as italic subtitle).

The first public version intentionally has no multi-image per-piece gallery field. If that is added later, define the field and renderer together, and verify the current EmDash media/list support before choosing the schema shape.

## Visual character

Typography is the design. The display face is **Playfair Display** (serif) on the `--font-heading` CSS variable; the body face is the system sans stack on `--font-body`. The serif is used for the site title, hero titles, piece titles, page titles, and major labels. Everything else is the sans. Serif weight is calm on purpose (`--font-weight-heading` and `--font-weight-display` both default to 500).

The brand colour is barely visible by design -- the only saturated colour on the page should be inside images. The default `--color-brand` (`#7c3aed`) is used sparingly for link hover and focus states.

Whitespace is generous. Sections breathe. Don't fight that.

## Customisation

Design tokens live in `src/styles/tokens.css` with their default values. To restyle the site, override tokens in `src/styles/theme.css` -- declarations there are unlayered, so they always beat the `@layer base` defaults. Don't edit `tokens.css` or `Base.astro` for visual changes.

Colours are defined with `light-dark(<light>, <dark>)`, so each token carries both modes. Overriding with a plain colour changes light and dark at once; use `light-dark()` in the override to keep them distinct. There is no separate dark palette to maintain.

The display face is configured in `astro.config.mjs` under `fonts:` (the Astro Fonts API). To change it, swap the `name:` for any Google Fonts serif and keep `cssVariable: "--font-heading"`. Good pairings: Cormorant Garamond, Fraunces, EB Garamond, DM Serif Display. The body face (`--font-body`) is a plain token in `tokens.css` -- system sans, deliberately quiet; override it in `theme.css` only if you have a reason.

CSS variables worth knowing (see `tokens.css` for the full list):

- `--color-brand`, `--color-on-brand`, `--color-brand-ring` -- the single accent, used very sparingly
- `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border` -- neutral palette
- `--color-danger` -- form errors
- `--font-heading` (Fonts API entry in `astro.config.mjs`), `--font-body` (token)
- `--font-weight-heading` / `--font-weight-display` (both 500) -- raise for a heavier serif voice
- `--font-size-4xl` -- the size of the homepage title and piece titles
- `--max-width` (720px), `--wide-width` (1200px) -- column widths

## What not to do

- Don't introduce gradients, drop shadows on cards, or coloured section backgrounds. The template's voice is calm and editorial; those break it.
- Don't change `--font-body` to a display font. Two display faces fight each other.
- Don't add more than one accent colour.
- Don't write generic copy like "Welcome to my portfolio" or "Crafting beautiful pieces". The work should speak; the words should be specific to leatherwork, item type, materials, place, or availability.
- Don't pack the home page with every piece. The featured framing is intentional -- 3-6 is plenty.
- Don't add ecommerce checkout, local cart behavior, or a local contact form in v1. Send contact and purchase intent to Etsy.
