import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";

/**
 * Saved decks, shared across machines.
 *
 * Sits behind the same password gate as everything else — middleware answers
 * unauthenticated API calls with a 401 before this route runs — so there is no
 * per-user scoping here. A deck belongs to the team, which is the point of
 * moving them off one person's browser.
 *
 * The table is created on demand rather than by a migration script: it's one
 * table, and a deploy shouldn't need a second step to be usable.
 *
 * With no DATABASE_URL every method answers `{ok:false, reason:"no-db"}` and
 * the client saves to localStorage instead.
 */
const noDb = () =>
  NextResponse.json(
    { ok: false, reason: "no-db" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );

const fail = (e: unknown) =>
  NextResponse.json({ ok: false, reason: "error", error: String(e) }, { status: 500 });

async function ensureTable() {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS decks (
      id       TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      prospect JSONB NOT NULL,
      saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Case-insensitive, so "Acme Corp" and "acme corp" are one deck: saving under
  // a name you've used before should update it, not leave two decks minutes
  // apart.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS decks_name_lower ON decks (lower(name))`;
}

export async function GET() {
  if (!sql) return noDb();
  try {
    await ensureTable();
    const decks = await sql`
      SELECT id, name, prospect, saved_at FROM decks ORDER BY saved_at DESC
    `;
    return NextResponse.json(
      { ok: true, decks },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  if (!sql) return noDb();
  try {
    const { name, prospect } = await req.json();
    const clean = String(name || "").trim();
    if (!clean || !prospect) {
      return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
    }
    await ensureTable();
    const [deck] = await sql`
      INSERT INTO decks (id, name, prospect, saved_at)
      VALUES (${`d${Date.now()}`}, ${clean}, ${JSON.stringify(prospect)}::jsonb, now())
      ON CONFLICT (lower(name)) DO UPDATE
        SET prospect = EXCLUDED.prospect,
            name     = EXCLUDED.name,
            saved_at = now()
      RETURNING id, name, prospect, saved_at
    `;
    return NextResponse.json(
      { ok: true, deck },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest) {
  if (!sql) return noDb();
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
    }
    await ensureTable();
    await sql`DELETE FROM decks WHERE id = ${id}`;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(e);
  }
}
