// GET /api/scrape?url=<prospect site>
//
// Fetches the prospect's homepage and pulls candidate logo images so the rep
// can pick one — "auto-fetch, then confirm", never auto-commit. No third-party
// deps: the HTML is mined with targeted regexes, which is plenty for meta tags.
//
// The real version also retries bot-blocked storefronts through a rendering
// proxy and scores <img> tags by how logo-ish their attributes look. This one
// keeps the shape and stops at the meta tags.

import { NextRequest, NextResponse } from "next/server";
import { domainOf, faviconUrl, normalizeUrl } from "@/lib/deck";

export const runtime = "nodejs";
export const maxDuration = 30;

type ScrapeResult = {
  ok: boolean;
  url: string;
  domain: string;
  title: string;
  /** Logo candidates, best guess first. The client shows them as a picker. */
  candidates: string[];
  error?: string;
};

/**
 * Resolve a possibly-relative src against the page URL.
 *
 * Anything that isn't http(s) is dropped: sites commonly declare a placeholder
 * `<link rel="icon" href="data:,">`, and that would otherwise reach the picker
 * as a candidate that can never render.
 */
function abs(base: string, src: string): string | null {
  if (!src) return null;
  try {
    const u = new URL(src, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/** First capture group of the first matching pattern. */
function firstMatch(html: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1].trim());
  }
  return "";
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  const url = normalizeUrl(raw);
  const domain = domainOf(raw);

  const result: ScrapeResult = { ok: false, url, domain, title: "", candidates: [] };
  if (!url) return NextResponse.json({ ...result, error: "Missing url" }, { status: 400 });

  // Always available, so an unreachable site still yields something usable.
  const fallbacks = [faviconUrl(raw)].filter(Boolean);

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Storefronts tend to refuse requests with no browser-ish UA.
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = (await res.text()).slice(0, 500_000);
    const base = res.url || url;

    result.title = firstMatch(html, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]);

    const found = [
      firstMatch(html, [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ]),
      firstMatch(html, [
        /<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
        /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i,
      ]),
    ]
      .map((src) => (src ? abs(base, src) : null))
      .filter((x): x is string => !!x);

    result.candidates = [...new Set([...found, ...fallbacks])];
    result.ok = result.candidates.length > 0;
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    // A blocked or slow site is routine, not an error worth failing the request
    // over — hand back the favicon fallback and let the rep paste a URL.
    return NextResponse.json(
      { ...result, ok: fallbacks.length > 0, candidates: fallbacks, error: String(e) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
