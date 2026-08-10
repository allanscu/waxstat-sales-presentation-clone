// Stateless signed-session helpers (HMAC-SHA256 over Web Crypto, so the same
// code runs in Edge middleware and in Node route handlers — no dependencies).
//
// Cookie value = base64url(payload).base64url(HMAC(payload, SESSION_SECRET))
// payload      = base64url(JSON.stringify({ exp }))   — no PII in the cookie.

const COOKIE_NAME = "deck_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const c of b) s += String.fromCharCode(c);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToString(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64urlEncode(sig);
}

/** Constant-time compare, so a signature can't be found byte by byte. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const SESSION_COOKIE = COOKIE_NAME;

export async function createSessionToken(secret: string): Promise<string> {
  const payload = b64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC }),
    ),
  );
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, await hmac(payload, secret))) return false;
  try {
    const { exp } = JSON.parse(b64urlDecodeToString(payload));
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SEC,
};
