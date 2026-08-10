import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  safeEqual,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/app/lib/session";

// POST /api/auth — check the password, set a signed httpOnly session cookie.
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correct = process.env.PASSWORD;
    const secret = process.env.SESSION_SECRET;

    if (!correct || !secret) {
      return NextResponse.json(
        { error: "Server misconfigured (PASSWORD and SESSION_SECRET must be set)" },
        { status: 500 },
      );
    }

    if (typeof password === "string" && safeEqual(password, correct)) {
      const res = NextResponse.json({ success: true });
      res.cookies.set(
        SESSION_COOKIE,
        await createSessionToken(secret),
        sessionCookieOptions,
      );
      return res;
    }

    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

// GET /api/auth — does the caller hold a valid session?
export async function GET(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const ok =
    !!secret &&
    (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, secret));
  return NextResponse.json({ authenticated: ok }, { status: ok ? 200 : 401 });
}

// DELETE /api/auth — lock it back up.
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
