/**
 * Where the builder keeps the deck currently being edited.
 *
 * Shared with /saved-presentations: opening a saved deck writes it here and
 * navigates home, which is the whole handover — the builder already loads from
 * this key on mount, so there is nothing else to coordinate.
 */
export const STORAGE_KEY = "deck-prospect-v1";
