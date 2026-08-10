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

  /** Which optional slides to include, keyed by slide id. */
  enabled: Record<string, boolean>;
};

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

  enabled: {
    "prospect-site": true,
    partners: true,
    pricing: true,
  },
};

// ── Fixed pitch content (placeholder) ──────────────────────────────────────

/** The questions the product exists to answer, and what you put against each. */
export const THREE_QUESTIONS = [
  { q: "What's out there?", a: "Every item, kept current" },
  { q: "Where do I get it?", a: "Every supplier carrying it" },
  { q: "What's it worth?", a: "The live market price" },
];

export const FEATURES = [
  "Live pricing from 30+ sources",
  "Inventory tracking with alerts",
  "Release calendar",
  "Historical data and charts",
  "One-click storefront listings",
  "Automated repricing rules",
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
export const PARTNERS: Partner[] = [
  { name: "Northwind Trading", logo: "/partners/northwind-trading.svg" },
  { name: "Contoso Retail", logo: "/partners/contoso-retail.svg" },
  { name: "Globex Supply", logo: "/partners/globex-supply.svg" },
  { name: "Fabrikam Wholesale", logo: "/partners/fabrikam-wholesale.svg" },
  { name: "Adventure Works", logo: "/partners/adventure-works.svg" },
  { name: "Initech Goods", logo: "/partners/initech-goods.svg" },
  { name: "Tailspin Outfitters", logo: "/partners/tailspin-outfitters.svg", onDark: true },
  { name: "Wingtip Traders", logo: "/partners/wingtip-traders.svg", onDark: true },
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
 * Site screenshot via a keyless third-party service. Fine for a demo; swap in
 * a service with an API key if you need it to be reliable.
 */
export function screenshotUrl(raw: string, width = 1280): string {
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
