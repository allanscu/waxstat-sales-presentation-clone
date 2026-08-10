# Notes for agents

Next.js 16 + React 19 + Tailwind v4 + TypeScript. Deploys to Vercel.

## Architecture

- `lib/deck.ts` — the `Prospect` data model, all fixed pitch copy (features,
  partners, tiers), the cost math (`computeCost`), and URL helpers
  (`screenshotUrl`, `faviconUrl`, `domainOf`). Edit content here, not in slides.
- `app/components/Slides.tsx` — `buildSlides(prospect)` returns the ordered
  slide list. Each slide is authored on a fixed **1280×720** canvas
  (`.slide-canvas`); use px units inside slides so scaling stays
  resolution-independent.
- `app/components/ScaledSlide.tsx` — scales a slide to fit width (preview) or
  the viewport (present mode).
- `app/page.tsx` — the builder: form (left) + live preview and thumbnails
  (right), present mode, and the hidden `.print-deck` used for PDF export.
  State persists to `localStorage`.
- `app/api/scrape/route.ts` — logo discovery. No deps; regex over meta tags.
- `app/saved-presentations/page.tsx` — every saved deck. Edit writes the deck
  into the builder's localStorage slot and navigates to `/`, which is the whole
  handover.
- `app/api/decks/route.ts` — saved decks (Postgres). Creates its own table on
  first use. With no `DATABASE_URL` it answers `{ok:false, reason:"no-db"}` and
  the builder falls back to the browser, so the app still runs without a
  database.
- `middleware.ts` + `app/api/auth` — password gate over every page and API
  route, backed by an HMAC-signed cookie (`app/lib/session.ts`). With
  `PASSWORD` or `SESSION_SECRET` unset the gate opens, so a bad env var can't
  lock anyone out mid-pitch.

## Gotchas

- Slides render in two places (live preview + `.print-deck`), and the preview
  wraps each thumbnail in a `<button>`. **Never put an interactive element
  (`<button>`, `<a>`) inside a slide** — it nests buttons and breaks hydration.
  Decorative pills and the contact email are `<span>`/`<div>`s on purpose.
- Prospect images are arbitrary remote URLs → plain `<img>` (the next/image
  lint rule is off in `eslint.config.mjs`). `SmartImg` falls through a list of
  candidate URLs on error, because a third-party logo URL failing is routine.
- PDF export is `window.print()` + `@media print` in `globals.css` (`@page` is
  landscape 1280×720, one `.print-slide` per page). No PDF library.
- Auto-fetched logos are always *confirmed* by the rep, never auto-applied.
- **Screenshot candidate order is load-bearing.** `SmartImg` falls through on
  `<img>` onError, so it can only skip a candidate that fails *as an image*.
  mShots answers a site it can't capture with a valid PNG of an error page, so
  onError never fires and everything behind it in the list is unreachable.
  Microlink goes first because it fails honestly (HTTP error → onError → next
  candidate). Don't reorder these without re-reading `screenshotUrl()`.
- Feature icons are matched by regex against the feature copy (`FEATURE_ICONS`
  in `Slides.tsx`), so `FEATURES` in `deck.ts` stays plain strings. **Order is
  significant** — the first regex that matches wins, and features overlap
  ("Automated repricing rules" contains "pricing"). Put the specific rule above
  the general one and check the mapping after editing copy; an unmatched
  feature silently falls back to a checkmark rather than erroring.

## Content

Everything in `lib/deck.ts` is placeholder. `BRAND` is the vendor; `TIERS` are
made-up prices; `PARTNERS` are invented companies whose logos are hand-drawn
SVGs in `public/partners/`, not any real firm's artwork. Nothing here is real
customer or pricing data, and it should stay that way.

Partner logos are served from `/public` rather than hot-linked — a partner's
own CDN URL can change without warning, and local files keep the slide working
offline and in the PDF. Set `onDark` on any logo drawn in white, or it
disappears against the default white tile.
