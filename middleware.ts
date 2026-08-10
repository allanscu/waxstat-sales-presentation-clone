// Password gate for the whole builder.
//
// Runs at the edge, ahead of every page and API route, so a deck is never
// served to an unauthenticated visitor. That matters more than it looks: all
// the slide copy ships inside the page's JS bundle, so a login screen enforced
// only in React would leave every word of it readable from the source.
//
// The session is a signed cookie (app/lib/session.ts). PASSWORD and
// SESSION_SECRET come from the environment; with either missing the gate opens,
// so a bad env var can't lock the team out mid-pitch.

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/session";

/** Reachable without a session — the gate itself, and what it needs to render. */
function isPublic(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/api/auth" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next/")
  );
}

export async function middleware(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!process.env.PASSWORD || !secret) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const ok = await verifySessionToken(
    req.cookies.get(SESSION_COOKIE)?.value,
    secret,
  );
  if (ok) return NextResponse.next();

  // APIs get a status they can act on; people get the login screen.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
