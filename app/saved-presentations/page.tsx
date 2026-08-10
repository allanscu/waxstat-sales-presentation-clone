"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "../lib/storage";
import { Prospect } from "@/lib/deck";

type Deck = { id: string; name: string; prospect: Prospect; saved_at: string };

/**
 * Every saved deck.
 *
 * "Edit" writes the deck into the builder's localStorage slot and navigates to
 * `/` — that is the whole handover, because the builder already loads from
 * that key on mount.
 */
export default function SavedPresentations() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [note, setNote] = useState("Loading…");

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setDecks(d.decks);
          setNote(d.decks.length ? "" : "No saved decks yet.");
        } else {
          setNote("No database configured — decks are saved in your browser only.");
        }
      })
      .catch(() => setNote("Could not load saved decks."));
  }, []);

  function edit(deck: Deck) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.prospect));
    router.push("/");
  }

  async function remove(id: string) {
    await fetch(`/api/decks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center gap-4">
        <h1 className="mr-auto text-2xl font-bold">Saved decks</h1>
        <Link href="/" className="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-ink/5">
          Back to builder
        </Link>
      </header>

      {note && <p className="mb-6 text-sm text-ink/60">{note}</p>}

      <ul className="space-y-3">
        {decks.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-4 rounded-xl border border-ink/10 bg-white p-4"
          >
            <div className="mr-auto">
              <div className="font-semibold">{d.name}</div>
              <div className="text-xs text-ink/50">
                {new Date(d.saved_at).toLocaleString()}
              </div>
            </div>
            <button onClick={() => edit(d)} className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white">
              Edit
            </button>
            <button onClick={() => remove(d.id)} className="text-sm text-ink/50 underline">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
