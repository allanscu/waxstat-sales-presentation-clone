# Sales Presentation Builder

Fill in a short form → a slide deck renders live → **Present** fullscreen or
**Download PDF**. One deck per prospect, in about two minutes, without anyone
hand-editing slides (and introducing typos) prospect to prospect.

This is a **stripped-down reference version**: the architecture is real and it
runs, but every slide, price, logo and figure is placeholder content. It exists
to show how the thing is put together, not to be a finished pitch.

## The idea

A deck is **fixed vendor content** (the same for everyone) plus a handful of
**per-prospect variables** (what the rep fills in):

| Input | Drives |
| --- | --- |
| Company name | Cover, section headings |
| Website | Auto-fetches logo candidates + a site screenshot |
| Logo | Cover (pick a fetched candidate, or paste a URL) |
| Items · min each · $/hour | The "what that costs by hand" math (auto-computed) |
| Presenter name / email | Cover and contact slides |

Slides are toggleable per prospect, and **drag the thumbnails to reorder** —
the order is saved with the prospect. **Meeting presets** ("Discovery",
"Proposal") switch on just the slides for one conversation, so a single slide
registry produces several decks. Inputs persist to `localStorage`, so a
half-built deck survives a refresh.

## Architecture

```
lib/deck.ts                 Prospect model, fixed content, cost math, URL helpers
app/components/Slides.tsx   buildSlides(prospect) → the ordered slide list
app/components/ScaledSlide  scales a 1280×720 canvas to fit
app/page.tsx                the builder: form + preview + present + print
app/api/scrape/route.ts     logo discovery from the prospect's site
app/api/decks/route.ts      saved decks (Postgres, optional)
app/api/auth + middleware   password gate over everything
```

Three ideas carry the whole design:

**Slides are data.** `buildSlides(prospect)` returns an array of
`{ id, title, group, el }`. Adding a slide means pushing one entry — it appears
in the preview, the thumbnails, present mode and the PDF at once, with no other
wiring, and it inherits include-toggles, meeting presets and drag-to-reorder
for free. Reordering is just a list of ids: `applySlideOrder` re-applies it,
splicing any slide the saved order doesn't mention in beside its natural
neighbour rather than dumping it at the end.

**One fixed canvas.** Every slide is authored in absolute px against a
1280×720 box. `ScaledSlide` applies a single CSS transform to fit it to a
thumbnail, the preview pane, or the full screen, so a slide looks identical
everywhere and nothing inside it has to be responsive.

**PDF export is `window.print()`.** A hidden `.print-deck` renders one
`.print-slide` per slide, and `@media print` in `globals.css` sets `@page` to
landscape 1280×720. No PDF library.

## Running it

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` if you want the password gate or a
database. Both are optional — with no `PASSWORD`/`SESSION_SECRET` the gate
opens, and with no `DATABASE_URL` decks save to the browser instead. Deploys to
Vercel as-is.

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript.

## Making it yours

1. `BRAND`, `FEATURES`, `PARTNERS`, `TIERS` in [lib/deck.ts](lib/deck.ts) —
   all the fixed copy lives there.
2. The colour tokens in the `@theme` block of
   [app/globals.css](app/globals.css) — and the matching `INK`/`ACCENT`
   constants at the top of `Slides.tsx`, since slides use inline styles.
3. The mark in [app/components/BrandMark.tsx](app/components/BrandMark.tsx).
4. Add or reorder slides in
   [app/components/Slides.tsx](app/components/Slides.tsx).
