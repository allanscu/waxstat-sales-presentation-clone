// ── Data model + fixed deck content ────────────────────────────────────────
//
// A deck = fixed vendor content (the pitch, which is the same for everyone) +
// a handful of per-prospect variables (the bits a rep fills in). Everything
// editable lives in `Prospect`; everything fixed lives in the constants below.
//
// All content here is placeholder. Swap `BRAND`, `FEATURES`, `PARTNERS` and
// `TIERS` for your own and the deck is yours.

/** The vendor doing the pitching — i.e. you. */
export const BRAND = {
  name: "Acme",
  product: "Acme Sales Deck Builder",
  website: "www.example.com",
  tagline: "One deck per prospect, built in two minutes",
};

export type Prospect = {
  // Identity
  companyName: string;
  website: string;
  /** Chosen prospect logo — picked from /api/scrape candidates, or pasted. */
  logoUrl: string;
  /** Screenshot of their site, auto-captured or pasted. */
  screenshotUrl: string;

  // "What if…" cost math
  itemCount: number;
  minutesPerItem: number;
  hourlyRate: number;

  // Presenter
  presenterName: string;
  presenterEmail: string;

  /** Which slides to include, keyed by slide id. Absent means included. */
  enabled: Record<string, boolean>;

  /**
   * Custom slide order, as slide ids. Empty means the deck's natural order.
   * Ids that aren't currently rendered are ignored, and a slide missing from
   * the list — a newly re-enabled one, or one added in a later release — slots
   * in beside its natural neighbour rather than being dumped at the end.
   */
  slideOrder: string[];
};

/**
 * Which meeting a slide belongs to. "general" slides — the cover and the
 * contact page — top and tail any deck; the rest belong to a specific meeting.
 */
export type SlideGroup = "general" | "discovery" | "proposal";

export const SLIDE_GROUPS: { id: SlideGroup; label: string; hint: string }[] = [
  { id: "general", label: "General purpose", hint: "In every deck" },
  { id: "discovery", label: "Discovery", hint: "Their problem, in their terms" },
  { id: "proposal", label: "Proposal", hint: "What you offer, and what it costs" },
];

/**
 * The meetings you can actually be in — every group bar "general", which is
 * the material both of them share rather than a meeting of its own. Drives the
 * preset buttons above the include list.
 */
export const MEETINGS = SLIDE_GROUPS.filter((g) => g.id !== "general");

/**
 * Apply a saved slide order to the deck's natural order.
 *
 * Slides the order doesn't mention are spliced in after whichever of their
 * natural predecessors survived, so a slide switched back on lands next to
 * where it belongs instead of at the end of the deck. That matters because the
 * order is saved per prospect and outlives any single edit: without it, every
 * toggle would quietly reshuffle a deck someone had already arranged.
 */
export function applySlideOrder<T extends { id: string }>(
  natural: T[],
  order: string[],
): T[] {
  if (!order?.length) return natural;
  const rank = new Map(order.map((id, i) => [id, i]));

  const out = natural
    .filter((s) => rank.has(s.id))
    .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);

  natural.forEach((slide, i) => {
    if (rank.has(slide.id)) return;
    // Walk back to the nearest earlier slide that did survive, and land just
    // after it. Nothing earlier survived → the front of the deck.
    let at = 0;
    for (let j = i - 1; j >= 0; j--) {
      const k = out.findIndex((o) => o.id === natural[j].id);
      if (k >= 0) {
        at = k + 1;
        break;
      }
    }
    out.splice(at, 0, slide);
  });

  return out;
}

export const DEFAULT_PROSPECT: Prospect = {
  companyName: "",
  website: "",
  logoUrl: "",
  screenshotUrl: "",

  itemCount: 400,
  minutesPerItem: 5,
  hourlyRate: 25,

  presenterName: "",
  presenterEmail: "",

  // Empty means "every slide in". Presets and checkboxes write entries here.
  enabled: {},
  slideOrder: [],
};

// ── Fixed pitch content (placeholder) ──────────────────────────────────────

/** The questions the product exists to answer, and what you put against each. */
export const THREE_QUESTIONS = [
  { q: "What's out there?", a: "Every item, kept current" },
  { q: "Where do I get it?", a: "Every supplier carrying it" },
  { q: "What's it worth?", a: "The live market price" },
];

export type Feature = {
  name: string;
  /** One line on what it actually does. The name is the claim; this earns it. */
  detail: string;
};

/**
 * What the product gives them.
 *
 * The name alone states a capability; the detail is what turns it into
 * something a prospect can picture themselves using. Keep details to one
 * line — the tile is a prompt for the presenter, not the script.
 */
export const FEATURES: Feature[] = [
  {
    name: "Live pricing from 30+ sources",
    detail: "Every retailer carrying the item, refreshed through the day.",
  },
  {
    name: "Inventory tracking with alerts",
    detail: "Hear the moment a competitor moves on something you hold.",
  },
  {
    name: "Release calendar",
    detail: "What's coming and when, so you can buy ahead of the rush.",
  },
  {
    name: "Historical data and charts",
    detail: "Price history behind every item — the trend, not just today.",
  },
  {
    name: "One-click storefront listings",
    detail: "Push to your store with pricing and images already filled in.",
  },
  {
    name: "Automated repricing rules",
    detail: "Set the margin once and let the rules hold your prices to it.",
  },
];

export type Partner = {
  name: string;
  logo: string;
  /** Artwork drawn in white — needs a dark tile behind it, not the usual one. */
  onDark?: boolean;
};

/**
 * The logo wall on the social-proof slide.
 *
 * These are invented companies with invented artwork, committed as SVGs under
 * `public/partners/`. Serving them locally rather than hot-linking is what the
 * real deck does too: a partner's own CDN URL can change without warning, and
 * local files keep the slide working offline and in the PDF export.
 *
 * Swap in your own files and names; keep `onDark` accurate, since white
 * artwork vanishes on a white tile.
 */
/**
 * Order is presentation, not data: the `onDark` partners are spaced through
 * the list rather than grouped. Left sorted, the dark tiles collect into one
 * solid row and the wall reads as a designed band instead of a set of logos.
 */
export const PARTNERS: Partner[] = [
  { name: "Northwind Trading", logo: "/partners/northwind-trading.svg" },
  { name: "Contoso Retail", logo: "/partners/contoso-retail.svg" },
  { name: "Tailspin Outfitters", logo: "/partners/tailspin-outfitters.svg", onDark: true },
  { name: "Globex Supply", logo: "/partners/globex-supply.svg" },
  { name: "Fabrikam Wholesale", logo: "/partners/fabrikam-wholesale.svg" },
  { name: "Adventure Works", logo: "/partners/adventure-works.svg" },
  { name: "Wingtip Traders", logo: "/partners/wingtip-traders.svg", onDark: true },
  { name: "Initech Goods", logo: "/partners/initech-goods.svg" },
  { name: "Litware Supply", logo: "/partners/litware-supply.svg" },
  { name: "Alpine Ski House", logo: "/partners/alpine-ski-house.svg", onDark: true },
  { name: "Proseware Goods", logo: "/partners/proseware-goods.svg" },
  { name: "Relecloud Traders", logo: "/partners/relecloud-traders.svg" },
  { name: "VanArsdel Ltd", logo: "/partners/vanarsdel-ltd.svg" },
  { name: "Fourth Coffee", logo: "/partners/fourth-coffee.svg", onDark: true },
  { name: "Lucerne Outfitters", logo: "/partners/lucerne-outfitters.svg" },
  { name: "Trey Research", logo: "/partners/trey-research.svg" },
  { name: "Woodgrove Supply", logo: "/partners/woodgrove-supply.svg" },
  { name: "Southridge Supply", logo: "/partners/southridge-supply.svg", onDark: true },
  { name: "Coho Collective", logo: "/partners/coho-collective.svg" },
  { name: "Margie's Market", logo: "/partners/margies-market.svg" },
];

export type Tier = {
  name: string;
  price: string;
  blurb: string;
  limit: string;
  popular?: boolean;
};

export const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "Free",
    blurb: "Kick the tires",
    limit: "Up to 2 tracked items",
  },
  {
    name: "Pro",
    price: "$29/mo",
    blurb: "For the part-time seller",
    limit: "Up to 200 tracked items",
    popular: true,
  },
  {
    name: "Business",
    price: "$99/mo",
    blurb: "For a shop watching its whole catalogue",
    limit: "Up to 10,000 tracked items",
  },
];

// ── Derived values ─────────────────────────────────────────────────────────

export type CostMath = {
  items: number;
  minutesPerItem: number;
  totalMinutes: number;
  hours: number;
  hourlyRate: number;
  laborCost: number;
};

/** The "what if you did this by hand" arithmetic behind the cost slide. */
export function computeCost(p: Prospect): CostMath {
  const items = Math.max(0, Math.round(p.itemCount || 0));
  const minutesPerItem = Math.max(0, p.minutesPerItem || 0);
  const totalMinutes = items * minutesPerItem;
  const hours = totalMinutes / 60;
  const hourlyRate = Math.max(0, p.hourlyRate || 0);
  return {
    items,
    minutesPerItem,
    totalMinutes,
    hours,
    hourlyRate,
    laborCost: hours * hourlyRate,
  };
}

export const usd0 = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

// ── URL helpers ────────────────────────────────────────────────────────────

/** Best-effort host from a user-typed website string. */
export function domainOf(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    return new URL(s).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0];
  }
}

/** Normalize to a full https URL for fetching or linking. */
export function normalizeUrl(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();
  return /^https?:\/\//i.test(s) ? s : "https://" + s;
}

/**
 * Site screenshot, keyless.
 *
 * Microlink is primary: it renders the page in a real browser, and
 * `embed=screenshot.url` makes it serve the image directly, so it drops
 * straight into an <img>.
 *
 * The order matters more than it looks. mShots answers a site it can't capture
 * with a *valid image of an error page* rather than an HTTP error — so <img>
 * onError never fires and SmartImg cannot fall through it. Anything behind
 * mShots in the candidate list is unreachable, which is why the service that
 * fails honestly goes first.
 *
 * Anonymous Microlink use is rate-limited per viewer IP, so mShots stays on as
 * the fallback for when that limit is hit.
 */
export function screenshotUrl(raw: string): string {
  const u = normalizeUrl(raw);
  if (!u) return "";
  return (
    "https://api.microlink.io/?url=" +
    encodeURIComponent(u) +
    "&screenshot=true&meta=false&embed=screenshot.url"
  );
}

/** WordPress mShots — the fallback. See the note above about how it fails. */
export function mshotsUrl(raw: string, width = 1280): string {
  const u = normalizeUrl(raw);
  if (!u) return "";
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(u)}?w=${width}`;
}

/** Google's favicon service — a reliable square-logo fallback. */
export function faviconUrl(raw: string, size = 256): string {
  const d = domainOf(raw);
  if (!d) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${size}`;
}
