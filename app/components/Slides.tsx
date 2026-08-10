"use client";

import { ReactNode, useEffect, useState } from "react";
import BrandLogo from "./BrandMark";
import {
  BRAND,
  FEATURES,
  Feature,
  PARTNERS,
  Prospect,
  SlideGroup,
  THREE_QUESTIONS,
  TIERS,
  applySlideOrder,
  computeCost,
  domainOf,
  faviconUrl,
  mshotsUrl,
  screenshotUrl,
  usd0,
} from "@/lib/deck";

// ── Primitives ─────────────────────────────────────────────────────────────
//
// Every slide is a 1280×720 canvas laid out in absolute px. ScaledSlide does
// the fitting, so nothing in here needs to be responsive.

// Mirrors the tokens in globals.css. Slides are authored in inline styles
// rather than utility classes, so the values are repeated here on purpose.
const INK = "#231f20";
const ACCENT = "#71d8a7";

function Slide({ children, pad = true }: { children: ReactNode; pad?: boolean }) {
  return (
    <div
      className="slide-canvas"
      style={{
        background: INK,
        color: "#fff",
        padding: pad ? 64 : 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>
      {children}
    </h2>
  );
}

function Rule() {
  return (
    <div style={{ width: 88, height: 6, background: ACCENT, borderRadius: 3, margin: "20px 0 36px" }} />
  );
}

/**
 * <img> that falls through a list of candidate URLs on error.
 *
 * Prospect artwork is fetched from third-party sites, so a given URL failing is
 * routine — the slide should quietly try the next one rather than show a
 * broken image in front of a customer.
 */
function SmartImg({
  srcs,
  alt,
  style,
}: {
  srcs: string[];
  alt: string;
  style?: React.CSSProperties;
}) {
  const list = srcs.filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [list.join("|")]);
  if (!list.length || i >= list.length) return null;
  return <img src={list[i]} alt={alt} style={style} onError={() => setI(i + 1)} />;
}

/** Emphasis used through the deck: italic + underline. */
function Em({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontStyle: "italic",
        textDecoration: "underline",
        textUnderlineOffset: 4,
        textDecorationThickness: 2,
      }}
    >
      {children}
    </span>
  );
}

/** A screenshot in browser chrome, so it reads as *their* site, not a mockup. */
function BrowserFrame({
  srcs,
  alt,
  width,
  height,
}: {
  srcs: string[];
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        width,
        borderRadius: 12,
        overflow: "hidden",
        background: "#0e1116",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 34,
          padding: "0 14px",
          background: "#1b2027",
        }}
      >
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <SmartImg
        srcs={srcs}
        alt={alt}
        style={{ width, height, objectFit: "contain", objectPosition: "top" }}
      />
    </div>
  );
}

/**
 * One dot per item, sized to fit the given width.
 *
 * Seeing the count as a field of dots lands harder than the digits alone — it
 * is visibly a wall of manual work. Large catalogues are capped so the dots
 * stay legible, with the remainder stated rather than silently dropped.
 */
function DotMatrix({
  count,
  width,
  maxDots = 600,
  centered = false,
}: {
  count: number;
  width: number;
  maxDots?: number;
  centered?: boolean;
}) {
  const shown = Math.max(0, Math.min(count, maxDots));
  if (shown === 0) return null;
  // A dot size that lays the count out as a comfortable block rather than a
  // long thin strip.
  const perRow = Math.ceil(Math.sqrt(shown * 3.2));
  const gap = 3;
  const dot = Math.max(4, Math.min(11, Math.floor(width / perRow) - gap));
  return (
    <div style={{ width, marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap,
          justifyContent: centered ? "center" : "flex-start",
        }}
      >
        {Array.from({ length: shown }, (_, i) => (
          <span
            key={i}
            style={{ width: dot, height: dot, borderRadius: 2, background: ACCENT, opacity: 0.85 }}
          />
        ))}
      </div>
      {count > shown && (
        <div style={{ fontSize: 13, marginTop: 8, color: "rgba(255,255,255,0.4)" }}>
          + {(count - shown).toLocaleString()} more
        </div>
      )}
    </div>
  );
}

function LineIcon({
  paths,
  width = 1.8,
  size = 20,
}: {
  paths: string[];
  width?: number;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/**
 * An icon per feature, matched on the copy itself so the FEATURES list in
 * deck.ts stays the single source of truth — reword a feature and it keeps a
 * sensible icon, with a checkmark as the fallback when nothing matches.
 *
 * Order matters. "Automated repricing rules" contains "pricing", so the
 * automation rule has to be tested before the pricing one or every repricing
 * feature gets a price tag.
 */
const FEATURE_ICONS: [RegExp, string[]][] = [
  [/automat|repric|rule/i, ["M4 12a8 8 0 0 1 13.7-5.6", "M20 12a8 8 0 0 1-13.7 5.6", "M18 2.5v4h-4", "M6 21.5v-4h4"]],
  [/alert|notif|inventory|track/i, ["M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z", "M10 19a2 2 0 0 0 4 0"]],
  [/calendar|release|schedul/i, ["M4 6.5h16v13H4z", "M8 3.5v4", "M16 3.5v4", "M4 11h16"]],
  [/chart|graph|historical|analytic|data/i, ["M4 20V4", "M4 20h16", "M7.5 16.5l3.5-4.5 3 2.8 4.5-6"]],
  [/listing|storefront|publish|shop|catalog/i, ["M3.5 9 5 4.5h14L20.5 9", "M5 9v10.5h14V9", "M9.5 19.5v-6h5v6"]],
  [/pricing|price|market|source|retailer|value/i, ["M3.5 3.5h8l9 9-8 8-9-9z", "M7.6 7.6h.01"]],
  [/scan|barcode|upc/i, ["M3.5 6v12", "M7 6v12", "M10.5 6v9", "M14 6v12", "M17.5 6v12", "M21 6v12"]],
  [/secure|protect|shield/i, ["M12 3l7 3v5.4c0 4.4-3 7.6-7 9.4-4-1.8-7-5-7-9.4V6l7-3Z", "M9.2 11.8l2 2 3.6-3.8"]],
];

function featureIcon(text: string, size = 20) {
  const hit = FEATURE_ICONS.find(([re]) => re.test(text));
  // The fallback checkmark is a single stroke, so it needs extra weight to
  // sit as heavy as the multi-path icons beside it.
  return (
    <LineIcon
      paths={hit ? hit[1] : ["M4.5 12.5 9.5 17.5 19.5 6.5"]}
      width={hit ? 1.8 : 2.4}
      size={size}
    />
  );
}

/**
 * One "what you get" tile: an icon chip, the feature, and the line that says
 * what it actually does.
 *
 * Sized to fill the slide rather than hug its text — six tiles bunched at the
 * top of a 720px canvas read as a list that ran out, not as a set.
 */
function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div
      style={{
        minHeight: 208,
        padding: "26px 28px",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.05)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ACCENT,
          background: "rgba(113,216,167,0.13)",
          boxShadow: "inset 0 0 0 1px rgba(113,216,167,0.38)",
          flex: "none",
        }}
      >
        {featureIcon(feature.name, 25)}
      </div>
      {/* Pushes the copy to the bottom, so tiles line up across the row even
          when one name wraps to two lines and its neighbours don't. */}
      <div style={{ marginTop: "auto", paddingTop: 18 }}>
        <div style={{ fontSize: 23, lineHeight: 1.22 }}>{feature.name}</div>
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.35,
            marginTop: 8,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {feature.detail}
        </div>
      </div>
    </div>
  );
}

// ── Slide registry ─────────────────────────────────────────────────────────

export type SlideDef = {
  id: string;
  title: string;
  /** Which meeting this slide belongs to. "general" slides are always in. */
  group: SlideGroup;
  el: ReactNode;
};

/**
 * The whole deck, as data.
 *
 * `buildSlides(prospect)` returns the ordered slide list for one prospect —
 * adding a slide means pushing one entry here, and it shows up in the preview,
 * the thumbnails, present mode and the PDF at once.
 *
 * Slides are built unconditionally and filtered once at the bottom, so there
 * is a single place that decides what's in a deck and in what order.
 *
 * `opts.all` ignores the include-toggles: the builder needs the full list to
 * render a checkbox for a slide that is currently switched off.
 */
export function buildSlides(p: Prospect, opts?: { all?: boolean }): SlideDef[] {
  const cost = computeCost(p);
  const company = p.companyName || domainOf(p.website) || "Your Company";
  const all = opts?.all === true;

  const logos = [p.logoUrl, faviconUrl(p.website)].filter(Boolean);
  // A hand-entered URL wins, then the capture services in order of how well
  // they fail — see screenshotUrl() in deck.ts. Deduped, since retrying an
  // identical URL only delays reaching the next candidate.
  const shots = [
    ...new Set(
      [p.screenshotUrl.trim(), screenshotUrl(p.website), mshotsUrl(p.website)].filter(
        Boolean,
      ),
    ),
  ];

  const slides: SlideDef[] = [];

  // 1. Cover
  slides.push({
    id: "cover",
    group: "general",
    title: "Cover",
    el: (
      <Slide>
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -140,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: ACCENT,
            opacity: 0.18,
            filter: "blur(40px)",
          }}
        />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
          <BrandLogo size={44} color={ACCENT} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 22, letterSpacing: "0.18em", color: ACCENT, textTransform: "uppercase" }}>
              Partnership proposal
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 18 }}>
              {logos.length > 0 && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 14,
                    width: 128,
                    height: 128,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  <SmartImg
                    srcs={logos}
                    alt={company}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>
              )}
              <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{company}</div>
            </div>
            <div style={{ marginTop: 24, fontSize: 26, opacity: 0.75 }}>{BRAND.tagline}</div>
          </div>
          {p.presenterName && (
            <div style={{ fontSize: 20, opacity: 0.7 }}>
              Presented by {p.presenterName}
              {p.presenterEmail ? ` · ${p.presenterEmail}` : ""}
            </div>
          )}
        </div>
      </Slide>
    ),
  });

  // 2. The problem, as three questions
  slides.push({
    id: "questions",
    group: "discovery",
    title: "The three questions",
    el: (
      <Slide>
        <Title>What every buyer asks</Title>
        <Rule />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {THREE_QUESTIONS.map((x) => (
            <div
              key={x.q}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 18,
                padding: 32,
                minHeight: 260,
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>{x.q}</div>
              <div style={{ width: 44, height: 4, background: ACCENT, borderRadius: 2, margin: "22px 0" }} />
              <div style={{ fontSize: 22, opacity: 0.8, lineHeight: 1.4 }}>{x.a}</div>
            </div>
          ))}
        </div>
      </Slide>
    ),
  });

  // 3. What you get
  slides.push({
    id: "features",
    group: "proposal",
    title: "What you get",
    el: (
      <Slide>
        <Title>What {BRAND.name} gives {company}</Title>
        <Rule />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.name} feature={f} />
          ))}
        </div>
      </Slide>
    ),
  });

  // 4. Social proof (optional)
  slides.push({
    id: "partners",
    group: "proposal",
    title: "Who already uses it",
    el: (
      <Slide>
        <Title>The industry already trusts us</Title>
        <Rule />
        {/* 5 across × 4 down for 20 logos. A wall is the point — the count
            is doing as much work here as any individual name on it. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 13 }}>
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              style={{
                height: 97,
                padding: "12px 16px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // White-on-transparent artwork would disappear on a white
                // tile, so those partners get a dark one instead.
                background: partner.onDark ? "#111827" : "#ffffff",
              }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 15, opacity: 0.45 }}>
          Invented companies with invented artwork — swap PARTNERS and the
          files in /public/partners for your own.
        </div>
      </Slide>
    ),
  });

  // 5. Their site (optional)
  //
  // The count is the argument, not the screenshot: their own storefront sits
  // beside it so the number can't be waved away as a generic industry stat.
  // With no capture available the count carries the slide alone, so it centres
  // and scales up rather than leaving a hole where the frame would be.
  const withImage = shots.length > 0;
  const stat = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: withImage ? "flex-start" : "center",
        textAlign: withImage ? "left" : "center",
      }}
    >
      {/* Deliberately not "on your site right now": the count is often an
          estimate, and framing it as the workload rather than an audited
          figure stays true either way. */}
      <div
        style={{
          fontSize: 13,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: ACCENT,
        }}
      >
        What you&rsquo;re up against
      </div>
      <div
        style={{
          fontSize: withImage ? 132 : 200,
          fontWeight: 800,
          lineHeight: 0.92,
          marginTop: 12,
        }}
      >
        {cost.items.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: withImage ? 27 : 34,
          lineHeight: 1.25,
          marginTop: 10,
          maxWidth: withImage ? 460 : 760,
          textWrap: "balance",
        }}
      >
        <Em>items</Em> in your catalogue
      </div>
      <DotMatrix
        count={cost.items}
        width={withImage ? 470 : 820}
        centered={!withImage}
      />
      <div
        style={{
          fontSize: withImage ? 21 : 25,
          lineHeight: 1.3,
          marginTop: 18,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        …and every one gets priced <Em>by hand</Em>.
      </div>
    </div>
  );

  slides.push({
    id: "prospect-site",
    group: "discovery",
    title: "Their site",
    el: (
      <Slide>
        {withImage ? (
          <div style={{ display: "flex", alignItems: "center", height: "100%", gap: 46 }}>
            <div style={{ flex: "none" }}>
              {/* 560×350 is the capture's own 16:10, so the whole page fits
                  with nothing cropped off the bottom. */}
              <BrowserFrame
                srcs={shots}
                alt={`${company} website`}
                width={560}
                height={350}
              />
              <div
                style={{ fontSize: 15, marginTop: 12, color: "rgba(255,255,255,0.45)" }}
              >
                {domainOf(p.website) || "their site"}
              </div>
            </div>
            <div style={{ flex: 1 }}>{stat}</div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              height: "100%",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {stat}
          </div>
        )}
      </Slide>
    ),
  });

  // 6. The cost of doing it by hand — the one computed slide
  slides.push({
    id: "what-if",
    group: "discovery",
    title: "What if…",
    el: (
      <Slide>
        <Title>What that costs you by hand</Title>
        <Rule />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {[
            [cost.items.toLocaleString(), "items"],
            [`${cost.minutesPerItem} min`, "each"],
            [usd0(cost.hourlyRate), "per hour"],
          ].map(([value, label], i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {i > 0 && <span style={{ fontSize: 40, opacity: 0.4 }}>×</span>}
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  padding: "26px 34px",
                  textAlign: "center",
                  minWidth: 190,
                }}
              >
                <div style={{ fontSize: 44, fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: 18, opacity: 0.65, marginTop: 6 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, fontSize: 30, opacity: 0.8 }}>
          {cost.hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hours a
          month, every month —
        </div>
        <div style={{ fontSize: 92, fontWeight: 800, color: ACCENT, marginTop: 8 }}>
          {usd0(cost.laborCost)}
        </div>
        <div style={{ fontSize: 22, opacity: 0.6, marginTop: 4 }}>in labour you can stop spending</div>
      </Slide>
    ),
  });

  // 7. Pricing (optional)
  slides.push({
    id: "pricing",
    group: "proposal",
    title: "Pricing",
    el: (
      <Slide>
        <Title>Pricing</Title>
        <Rule />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {TIERS.map((t) => (
            <div
              key={t.name}
              style={{
                borderRadius: 20,
                padding: 32,
                minHeight: 320,
                background: t.popular ? ACCENT : "rgba(255,255,255,0.06)",
                border: `1px solid ${t.popular ? ACCENT : "rgba(255,255,255,0.12)"}`,
                // The teal is light: the highlighted card takes onyx text,
                // not the white the rest of the slide inherits.
                color: t.popular ? INK : "#fff",
              }}
            >
              <div style={{ fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.8 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, margin: "14px 0" }}>{t.price}</div>
              <div style={{ fontSize: 22, opacity: 0.85, lineHeight: 1.35 }}>{t.blurb}</div>
              <div style={{ fontSize: 20, opacity: 0.7, marginTop: 20 }}>{t.limit}</div>
            </div>
          ))}
        </div>
      </Slide>
    ),
  });

  // 8. Contact
  slides.push({
    id: "contact",
    group: "general",
    title: "Contact",
    el: (
      <Slide>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <BrandLogo size={52} color={ACCENT} />
          <div style={{ fontSize: 64, fontWeight: 800, marginTop: 40 }}>Let&rsquo;s get started</div>
          <div style={{ fontSize: 26, opacity: 0.75, marginTop: 24, lineHeight: 1.7 }}>
            {p.presenterName && <div>{p.presenterName}</div>}
            {/* Deliberately a <span>, not an <a>: slides render inside preview
                buttons, and nesting interactive elements breaks hydration. */}
            {p.presenterEmail && <div>{p.presenterEmail}</div>}
            <div style={{ color: ACCENT }}>{BRAND.website}</div>
          </div>
        </div>
      </Slide>
    ),
  });

  // "general" slides top and tail every deck and aren't toggleable. Everything
  // else is in unless explicitly switched off, so a deck saved before a slide
  // existed still gets it.
  const included = all
    ? slides
    : slides.filter((s) => s.group === "general" || p.enabled?.[s.id] !== false);

  return applySlideOrder(included, p.slideOrder);
}
