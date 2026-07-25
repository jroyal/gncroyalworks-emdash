# Automatic Image Optimization Spec

## Summary

GNCRoyalWorks should let an editor upload raw phone photos without thinking about file size, format, or responsive image variants. The site should keep the original upload as the source of truth, then automatically serve small, modern, cached renditions on public pages.

The recommended first implementation is to keep EmDash uploads in the existing Cloudflare R2 bucket and enable Cloudflare Images delivery-time transformations through the built-in Cloudflare/EmDash image endpoint. This keeps the editor workflow unchanged and avoids moving the media library to Cloudflare Images hosted storage.

Last checked against Cloudflare docs on July 24, 2026.

## Goals

- Dad uploads the image he has: phone JPEG, PNG, and ideally HEIC.
- Public pages serve optimized responsive images without manual export steps.
- Original files remain available in R2 for future reprocessing.
- Gallery cards, detail heroes, and social previews use appropriate sizes.
- The implementation should be boring to operate and cheap at gallery scale.
- The editor should not need to learn Cloudflare Images, image dimensions, or compression.

## Non-Goals

- No local ecommerce image pipeline.
- No manual desktop image-prep workflow.
- No custom image editor in the admin UI for v1.
- No deletion of original uploads unless a later retention policy explicitly chooses that.

## Current Project Fit

The site already uses EmDash with R2 storage:

- `astro.config.mjs` configures `storage: r2({ binding: "MEDIA" })`.
- `wrangler.jsonc` binds the `MEDIA` R2 bucket named `gncroyalworks-emdash`.
- Public pages render media through EmDash's `<Image image={...} />` component.
- `@emdash-cms/cloudflare` includes an R2-aware image endpoint that reads EmDash media bytes from storage and uses a Cloudflare `IMAGES` binding when available.
- `@emdash-cms/cloudflare` also includes a Cloudflare Images hosted media provider, but that should be treated as a fallback rather than the default path.

## Recommended Path

Use R2 for originals plus Cloudflare Images transformations for delivery.

In v1, add an `IMAGES` binding to `wrangler.jsonc` and verify that the existing EmDash `<Image>` rendering starts producing optimized renditions through the Cloudflare/EmDash image endpoint. Keep the admin upload flow exactly as it is.

This path is preferred because it changes the least, keeps originals in the current bucket, uses the site framework's existing image integration, and bills by unique transformed variants rather than by hosted Images storage and delivery.

## Option A: R2 Originals + Cloudflare Images Transformations

### How It Works

1. Editor uploads a file in EmDash.
2. EmDash stores the original file in R2 through the existing `MEDIA` binding.
3. Public pages render image URLs through EmDash/Astro image handling.
4. The Cloudflare image endpoint reads original bytes from R2.
5. Cloudflare Images creates resized WebP/AVIF/JPEG/PNG outputs and caches them.

### Implementation

- Add an Images binding named `IMAGES` to `wrangler.jsonc`.
- Confirm the Astro Cloudflare image endpoint is active in production.
- Keep using EmDash `<Image>` for cards and detail images unless testing shows it does not emit the sizes we need.
- If needed, wrap `Image` in a local `OptimizedImage.astro` component to standardize sizes:
  - Card: roughly 480, 720, 960 widths, 4:3 crop or cover.
  - Detail hero: roughly 960, 1440, 1920 widths, scale down.
  - Open Graph: 1200x630 or fallback original if crop is not desired.
- Use long immutable cache headers for transformed media.
- Add fallback behavior so an image still renders if transformation fails.

### Cost Model

Cloudflare Images pricing currently includes 5,000 unique transformations per month on the free plan. Paid transformations are currently $0.50 per 1,000 unique transformations after the included amount.

R2 standard storage currently includes 10 GB-month per month free, then $0.015 per GB-month. R2 has no egress charge. Class A writes and Class B reads are also metered, but this gallery is unlikely to approach the free operation allowances early on.

Example:

- 200 uploaded pieces.
- 4 generated public variants per piece.
- 800 unique transformations in a month.
- Likely $0 Cloudflare Images transformation cost.
- R2 storage depends on original upload size. If 200 originals average 8 MB, storage is about 1.6 GB, likely inside the R2 free tier.

Larger example:

- 2,000 uploaded pieces.
- 5 generated variants per piece.
- 10,000 unique transformations in a month.
- 5,000 included, 5,000 billable.
- Estimated Images transformation cost: about $2.50/month, plus R2 storage/operation costs.

### Risks

- The built-in EmDash endpoint uses the Cloudflare Images binding, whose `.input()` limit is currently 20 MB. Large phone HEICs may fit; raw PNGs may not.
- Cloudflare remote transformations support larger source files than the binding path, but that may require serving originals through a controlled public URL and transforming via `fetch(..., { cf: { image } })` instead of byte input.
- HEIC is supported by Cloudflare Images, but the local EmDash upload MIME path needs testing. If EmDash or browser MIME detection sends `application/octet-stream` or rejects `.heic`, we need a small upload compatibility fix.
- Very large images over Cloudflare's remote image limits still need rejection or pre-upload normalization.

## Option B: R2 Originals + Precomputed R2 Derivatives

### How It Works

1. Editor uploads the original into R2.
2. A background job creates derivative files, such as `card.webp`, `large.webp`, and `og.jpg`.
3. Public pages serve those derivative files directly from R2/CDN.

### Implementation Options

- Use an EmDash `media:afterUpload` hook to enqueue work after upload.
- Use a Queue or scheduled Worker to process newly uploaded media.
- Store derivative metadata either in media `meta`, plugin storage, or a predictable R2 key convention.
- Update rendering to prefer derivatives and fall back to the original.

### Why This Is Not v1

Workers-compatible image processing without Cloudflare Images is weak for this job. Sharp/libvips is not a normal Workers dependency, and HEIC decoding is especially risky. Using the Cloudflare Images binding to precompute derivatives has the same 20 MB input limit as the built-in delivery endpoint. If we need to handle 20-100 MB originals, a URL/fetch transformation path is likely better than byte-level binding processing.

This path becomes attractive only if monthly transformation costs grow enough that paying once per derivative is materially cheaper than transforming on demand, or if public pages need completely static derivative URLs.

## Option C: Cloudflare Images Hosted Storage

### How It Works

1. EmDash uses the Cloudflare Images media provider.
2. Images are uploaded into Cloudflare Images hosted storage.
3. Public URLs use Cloudflare Images variants/delivery URLs.

### Cost Model

Cloudflare Images hosted storage currently requires the paid Images plan. Pricing is currently $5 per 100,000 stored images per month and $1 per 100,000 delivered images, plus plan/feature behavior described by Cloudflare.

### Why This Is Not Recommended First

Hosted Images uploads currently have a 10 MB image file limit. That is too tight for "raw phone photos, PNG, or HEIC" as the default editor path. It also changes the media provider/admin workflow more than necessary.

Use this only if:

- The editor workflow is acceptable in EmDash.
- Real uploads are consistently under the hosted limit.
- We want Cloudflare Images-hosted media management more than we want R2 originals.

## Plugin Findings

There is no obvious already-installed EmDash media optimizer plugin in this repo, and the known recommended Codex plugins do not include an EmDash or Cloudflare Images optimizer.

The useful "plugin" answer is that the needed capability appears to already live in the EmDash Cloudflare package:

- R2 storage provider is already configured.
- Cloudflare Images hosted media provider exists.
- R2 media transformation endpoint exists and can use an `IMAGES` binding.

A custom EmDash plugin should be a last resort. The documented `media:beforeUpload` hook receives file metadata, not bytes. The documented `media:afterUpload` hook receives the media record, not the uploaded stream. That makes a normal sandboxed plugin a poor place to do transparent byte-level conversion. If built-ins are insufficient, build a first-party custom media provider or upload route instead of a marketplace-style plugin.

## HEIC and Large Upload Strategy

The first implementation should explicitly test real files from Dad's phone:

- iPhone HEIC photo, 3-10 MB.
- Large iPhone HEIC photo, 10-20 MB.
- PNG screenshot/export, 10-30 MB.
- A deliberately oversized PNG over 20 MB.

Expected handling:

- Files under the EmDash and Images binding limits should upload normally and render optimized.
- Files accepted by upload but too large for the binding should still show the original and log a transform failure.
- If HEIC upload is rejected because MIME detection or allowlists do not recognize it, add targeted HEIC support before changing the whole storage design.
- If many real files exceed 20 MB, add a second delivery path using a public/private origin URL and Cloudflare `cf.image` remote transformations, which currently support larger source files than the binding.

## Phased Plan

### Phase 1: Enable Built-In Delivery Optimization

- Add the Cloudflare Images binding named `IMAGES` in `wrangler.jsonc`.
- Regenerate Worker types if needed.
- Deploy to a preview or production-safe branch environment.
- Upload real phone images through EmDash.
- Verify public pages serve transformed images rather than originals.
- Verify fallback behavior when transformation fails.

### Phase 2: Standardize Rendered Sizes

- Audit generated markup from `<Image>`.
- Introduce `src/components/OptimizedMedia.astro` only if the current component does not give enough control.
- Use fixed responsive size policies for:
  - Gallery cards.
  - Detail hero.
  - Related-piece cards.
  - Open Graph images.
- Keep original image URLs out of normal public `srcset` choices.

### Phase 3: Handle HEIC and Oversized Edge Cases

- Confirm `.heic` and `image/heic` upload behavior in EmDash.
- Add a targeted upload compatibility patch if needed.
- Add an admin-facing but plain-language error for images over hard platform limits.
- If many images exceed 20 MB, implement a route using URL/fetch-based Cloudflare transformations against a controlled original URL.

### Phase 4: Optional Precomputed Derivatives

- Add a queue-backed derivative generator only if traffic or transformation costs justify it.
- Keep originals in R2.
- Store derivative state so the public site can distinguish ready, pending, and failed renditions.
- Preserve the delivery-time transformation path as fallback.

## Acceptance Tests

- Uploading a normal phone JPEG creates a media item and public pages render optimized variants.
- Uploading a HEIC either works end-to-end or returns a clear admin error with the next implementation task identified.
- Uploading a large PNG under platform limits does not break the admin flow.
- Public gallery card images are not serving the full original file.
- Detail hero image is constrained to an appropriate maximum width.
- Build and typecheck pass.
- Production smoke test verifies `/`, `/finished-work`, and one piece detail page.

## Decision

Proceed with R2 originals plus Cloudflare Images delivery transformations first. Do not migrate to Cloudflare Images hosted storage for v1. Do not build a custom plugin until real upload tests prove the built-in R2 + `IMAGES` binding path cannot handle Dad's actual photos.

## Sources

- [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/)
- [Cloudflare Images limits and formats](https://developers.cloudflare.com/images/get-started/limits/)
- [Cloudflare Images optimize with Workers](https://developers.cloudflare.com/images/optimization/binding/)
- [Cloudflare Images transform via Workers](https://developers.cloudflare.com/images/optimization/transformations/transform-via-workers/)
- [Cloudflare Images features](https://developers.cloudflare.com/images/optimization/features/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare HEIC support changelog](https://developers.cloudflare.com/changelog/post/heic-support/)
- [EmDash media providers guide](https://docs.emdashcms.com/guides/media-library/)
