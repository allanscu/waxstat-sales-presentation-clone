"use client";

import { ReactNode, useEffect, useState } from "react";
import BrandLogo from "./BrandMark";
import {
  BRAND,
  FEATURES,
  PARTNERS,
  Prospect,
  THREE_QUESTIONS,
  TIERS,
  computeCost,
  domainOf,
  faviconUrl,
  screenshotUrl,
  usd0,
} from "@/lib/deck";

// ── Primitives ─────────────────────────────────────────────────────────────
//
// Every slide is a 1280×720 canvas laid out in absolute px. ScaledSlide does
// the fitting, so nothing in here needs to be responsive.

const INK = "#14161c";
const ACCENT = "#6366f1";

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

// ── Slide registry ─────────────────────────────────────────────────────────

export type SlideDef = {
  id: string;
  title: string;
  el: ReactNode;
  /** Optional slides get a checkbox in the builder; required ones don't. */
  optional?: boolean;
};

/**
 * The whole deck, as data.
 *
 * `buildSlides(prospect)` returns the ordered slide list for one prospect —
 * adding a slide means pushing one entry here, and it shows up in the preview,
 * the thumbnails, present mode and the PDF at once.
 *
 * `opts.all` ignores the include-toggles: the builder needs the full list to
 * render a checkbox for a slide that is currently switched off.
 */
export function buildSlides(p: Prospect, opts?: { all?: boolean }): SlideDef[] {
  const cost = computeCost(p);
  const company = p.companyName || domainOf(p.website) || "Your Company";
  const all = opts?.all === true;
  const on = (id: string) => all || p.enabled?.[id] !== false;

  const logos = [p.logoUrl, faviconUrl(p.website)].filter(Boolean);
  const shots = [p.screenshotUrl, screenshotUrl(p.website)].filter(Boolean);

  const slides: SlideDef[] = [];

  // 1. Cover
  slides.push({
    id: "cover",
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
    title: "What you get",
    el: (
      <Slide>
        <Title>What {BRAND.name} gives {company}</Title>
        <Rule />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {FEATURES.map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "22px 26px",
                fontSize: 24,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: ACCENT,
                  flex: "none",
                }}
              />
              {f}
            </div>
          ))}
        </div>
      </Slide>
    ),
  });

  // 4. Social proof (optional)
  if (on("partners")) {
    slides.push({
      id: "partners",
      title: "Who already uses it",
      optional: true,
      el: (
        <Slide>
          <Title>The industry already trusts us</Title>
          <Rule />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {PARTNERS.map((name) => (
              <div
                key={name}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  padding: "18px 30px",
                  fontSize: 24,
                }}
              >
                {name}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, fontSize: 20, opacity: 0.55 }}>
            Placeholder names — the real deck renders logo artwork from /public.
          </div>
        </Slide>
      ),
    });
  }

  // 5. Their site (optional)
  if (on("prospect-site")) {
    slides.push({
      id: "prospect-site",
      title: "Their site",
      optional: true,
      el: (
        <Slide>
          <Title>{company} today</Title>
          <Rule />
          <div
            style={{
              background: "#000",
              borderRadius: 16,
              overflow: "hidden",
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {shots.length ? (
              <SmartImg
                srcs={shots}
                alt={`${company} website`}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
              />
            ) : (
              <span style={{ opacity: 0.5, fontSize: 22 }}>
                Add a website above to capture a screenshot
              </span>
            )}
          </div>
        </Slide>
      ),
    });
  }

  // 6. The cost of doing it by hand — the one computed slide
  slides.push({
    id: "what-if",
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
  if (on("pricing")) {
    slides.push({
      id: "pricing",
      title: "Pricing",
      optional: true,
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
  }

  // 8. Contact
  slides.push({
    id: "contact",
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

  return slides;
}
