import { neon } from "@neondatabase/serverless";

/**
 * Postgres, when it's configured.
 *
 * Deliberately null rather than throwing when DATABASE_URL is missing: the app
 * is useful without a database, and the builder shouldn't fail to load just
 * because saved decks have nowhere to go. The decks API reports the absence
 * and the client falls back to the browser.
 */
export const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : null;
