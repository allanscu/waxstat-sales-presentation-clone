"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ScaledSlide from "./components/ScaledSlide";
import VersionFooter from "./components/VersionFooter";
import { buildSlides } from "./components/Slides";
import { STORAGE_KEY } from "./lib/storage";
import { BRAND, DEFAULT_PROSPECT, MEETINGS, Prospect, SlideGroup } from "@/lib/deck";

/**
 * The builder: form on the left, live preview on the right.
 *
 * Everything downstream — thumbnails, present mode, the PDF — renders from the
 * same `buildSlides(prospect)` call, so there is exactly one definition of what
 * the deck is. State persists to localStorage on every keystroke, so a
 * half-built deck survives a refresh (and is the handover channel from
 * /saved-presentations).
 */
export default function Page() {
  const [p, setP] = useState<Prospect>(DEFAULT_PROSPECT);
  const [loaded, setLoaded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [present, setPresent] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const set = useCallback(
    <K extends keyof Prospect>(key: K, value: Prospect[K]) =>
      setP((prev) => ({ ...prev, [key]: value })),
    [],
  );

  // Restore, then persist. The `loaded` flag keeps the first render from
  // writing DEFAULT_PROSPECT over a saved deck.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setP({ ...DEFAULT_PROSPECT, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {}
  }, [p, loaded]);

  // Every slide, including the switched-off ones, so the include list can show
  // a checkbox for each.
  const allSlides = useMemo(() => buildSlides(p, { all: true }), [p]);
  const slides = useMemo(() => buildSlides(p), [p]);
  const current = Math.min(idx, Math.max(0, slides.length - 1));

  const go = useCallback(
    (delta: number) =>
      setIdx((i) => Math.max(0, Math.min(slides.length - 1, i + delta))),
    [slides.length],
  );

  // Present mode: arrows advance, Esc leaves.
  useEffect(() => {
    if (!present) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPresent(false);
      else if (e.key === "ArrowRight" || e.key === " ") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, go]);

  /**
   * Move a slide and persist the result.
   *
   * The saved order is the ids of the slides currently on screen. Slides that
   * are switched off aren't in it, and applySlideOrder splices them back beside
   * their natural neighbour if they're switched on again — so reordering a
   * short deck doesn't scramble the full one.
   */
  function moveSlide(from: number, to: number) {
    if (from === to) return;
    const ids = slides.map((s) => s.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    set("slideOrder", ids);
    setIdx(to);
  }

  /** Switch on just the slides for one meeting (or all of them). */
  function applyPreset(group: SlideGroup | "all") {
    const next: Record<string, boolean> = {};
    for (const s of allSlides) {
      // General slides are always in, so they get no entry either way.
      if (s.group === "general") continue;
      next[s.id] = group === "all" || s.group === group;
    }
    set("enabled", next);
    setIdx(0);
  }

  /** Ask the server for logo candidates from the prospect's site. */
  async function fetchLogos() {
    if (!p.website.trim()) return;
    setFetching(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(p.website)}`);
      const data = await res.json();
      setCandidates(data.candidates || []);
      if (!data.candidates?.length) setStatus("Nothing found — paste a logo URL instead.");
      // Auto-fetch, then confirm: never pick for them.
    } catch {
      setStatus("Fetch failed — paste a logo URL instead.");
    } finally {
      setFetching(false);
    }
  }

  /** Save to the shared database, falling back to a message when there is none. */
  async function saveDeck() {
    const name = p.companyName.trim();
    if (!name) return setStatus("Add a company name first.");
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prospect: p }),
      });
      const data = await res.json();
      setStatus(
        data.ok
          ? `Saved “${name}”.`
          : "No database configured — this deck lives in your browser.",
      );
    } catch {
      setStatus("Save failed.");
    }
  }

  if (present) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        onClick={() => go(1)}
      >
        <ScaledSlide mode="fit-screen">{slides[current]?.el}</ScaledSlide>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPresent(false);
          }}
          className="absolute top-4 right-4 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white"
        >
          Esc
        </button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-8">
      <header className="no-print mb-8 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">{BRAND.product}</h1>
        <Link
          href="/saved-presentations"
          className="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5"
        >
          Saved decks
        </Link>
        <button onClick={saveDeck} className="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5">
          Save
        </button>
        <button onClick={() => window.print()} className="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5">
          Download PDF
        </button>
        <button
          onClick={() => setPresent(true)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink hover:bg-accent-dark"
        >
          Present
        </button>
      </header>

      {status && (
        <p className="no-print mb-4 rounded-lg bg-accent/10 px-3 py-2 text-sm">{status}</p>
      )}

      <div className="no-print grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* ── Form ── */}
        <div className="space-y-6">
          <Card title="Prospect">
            <Field label="Company name">
              <input
                className={inputCls}
                value={p.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Acme Corp"
              />
            </Field>
            <Field label="Website">
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={p.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="example.com"
                />
                <button
                  onClick={fetchLogos}
                  disabled={fetching}
                  className="shrink-0 rounded-lg border border-ink/20 px-3 text-sm disabled:opacity-50"
                >
                  {fetching ? "…" : "Fetch"}
                </button>
              </div>
            </Field>
            {candidates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {candidates.map((src) => (
                  <button
                    key={src}
                    onClick={() => set("logoUrl", src)}
                    className={`h-16 w-16 rounded-lg border-2 bg-white p-1 ${
                      p.logoUrl === src ? "border-accent" : "border-ink/15"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <Field label="Logo URL">
              <input
                className={inputCls}
                value={p.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Screenshot URL (blank = auto-capture)">
              <input
                className={inputCls}
                value={p.screenshotUrl}
                onChange={(e) => set("screenshotUrl", e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </Card>

          <Card title="Cost math">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Items">
                <input
                  type="number"
                  className={inputCls}
                  value={p.itemCount}
                  onChange={(e) => set("itemCount", Number(e.target.value))}
                />
              </Field>
              <Field label="Min each">
                <input
                  type="number"
                  className={inputCls}
                  value={p.minutesPerItem}
                  onChange={(e) => set("minutesPerItem", Number(e.target.value))}
                />
              </Field>
              <Field label="$ / hour">
                <input
                  type="number"
                  className={inputCls}
                  value={p.hourlyRate}
                  onChange={(e) => set("hourlyRate", Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>

          <Card title="Presenter">
            <Field label="Name">
              <input
                className={inputCls}
                value={p.presenterName}
                onChange={(e) => set("presenterName", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                value={p.presenterEmail}
                onChange={(e) => set("presenterEmail", e.target.value)}
              />
            </Field>
          </Card>

          <Card title="Slides to include">
            {/* Presets pick the deck you'd take into a given meeting. General
                slides aren't listed — they're in every deck either way. */}
            <div className="flex flex-wrap gap-2">
              {MEETINGS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => applyPreset(m.id)}
                  title={m.hint}
                  className="rounded-lg border border-ink/20 px-2.5 py-1 text-xs hover:bg-ink/5"
                >
                  {m.label}
                </button>
              ))}
              <button
                onClick={() => applyPreset("all")}
                className="rounded-lg border border-ink/20 px-2.5 py-1 text-xs hover:bg-ink/5"
              >
                All
              </button>
            </div>

            {MEETINGS.map((m) => (
              <div key={m.id} className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                  {m.label}
                </div>
                {allSlides
                  .filter((s) => s.group === m.id)
                  .map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={p.enabled[s.id] !== false}
                        onChange={(e) =>
                          set("enabled", { ...p.enabled, [s.id]: e.target.checked })
                        }
                      />
                      {s.title}
                    </label>
                  ))}
              </div>
            ))}
          </Card>

          <button
            onClick={() => setP(DEFAULT_PROSPECT)}
            className="text-sm text-ink/50 underline"
          >
            Clear everything
          </button>
        </div>

        {/* ── Preview ── */}
        <div>
          <div className="overflow-hidden rounded-xl shadow-lg">
            <ScaledSlide>{slides[current]?.el}</ScaledSlide>
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button onClick={() => go(-1)} className="rounded border border-ink/20 px-3 py-1">
              ←
            </button>
            <button onClick={() => go(1)} className="rounded border border-ink/20 px-3 py-1">
              →
            </button>
            <span className="text-ink/60">
              {current + 1} / {slides.length} · {slides[current]?.title}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(e) => {
                  // Without preventDefault the browser refuses the drop.
                  e.preventDefault();
                  setDragOver(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) moveSlide(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                title={`${s.title} — drag to reorder`}
                className={`overflow-hidden rounded-lg border-2 text-left transition ${
                  dragOver === i && dragFrom !== i
                    ? "border-accent-dark"
                    : i === current
                      ? "border-accent"
                      : "border-transparent"
                } ${dragFrom === i ? "opacity-40" : ""}`}
              >
                {/* Slides render inside this <button>, which is why nothing in
                    a slide may itself be interactive. */}
                <ScaledSlide>{s.el}</ScaledSlide>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden deck used only by window.print() — one page per slide. */}
      <div className="print-deck hidden">
        {slides.map((s) => (
          <div key={s.id} className="print-slide">
            {s.el}
          </div>
        ))}
      </div>

      <VersionFooter />
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-accent";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-ink/10 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-ink/60">{label}</span>
      {children}
    </label>
  );
}
