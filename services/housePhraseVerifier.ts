/* ─────────────────────────────────────────────────────────────────────────
 * BUTLER AI™ — THE HOUSE PHRASE™ · Stage 3 of The Key Ceremony™
 * © 2024–2026 Shawn P. ALL RIGHTS RESERVED.
 *
 * PROPRIETARY. THE HOUSE PHRASE is a registered trademark concept of
 * Shawn P. and is protected trade dress under The Household Protocol™.
 *
 * MECHANISM: at pairing instant both phone and PC display the same 3
 * English words derived deterministically from HMAC-SHA256 of the session
 * key. The user confirms a match before the session opens. This is a
 * man-in-the-middle defence (same principle as Signal Safety Numbers /
 * Bluetooth numeric comparison), delivered as ceremony.
 *
 * The word list (2048 words), derivation algorithm, and phrase index
 * tables are TRADE SECRETS and ship ONLY in the compiled server binary.
 * The app receives the 3-word string from the server after pairing.
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Represents the 3-word House Phrase returned by the server after the
 * XUSLINK™ pairing handshake. Words are uppercase, separated by " · ".
 * Example: "COPPER · LANTERN · SEVEN"
 */
export interface HousePhrase {
  word1: string;
  word2: string;
  word3: string;
  /** Full display string: "WORD1 · WORD2 · WORD3" */
  display: string;
  /** ISO timestamp of when the phrase was generated (server-side) */
  generatedAt: string;
  /** Session ID this phrase belongs to — single use */
  sessionId: string;
}

/**
 * Result of verifying the user's phrase confirmation.
 */
export type PhraseVerdict =
  | { ok: true;  sessionId: string }
  | { ok: false; reason: 'MISMATCH' | 'EXPIRED' | 'INVALID' };

// Phrase validity window: 90 seconds after generation
const PHRASE_TTL_MS = 90_000;

/**
 * Parse a raw House Phrase string from the server.
 * Expected format: "WORD1 · WORD2 · WORD3"
 * Returns null if the format is invalid (tamper-detected).
 */
export function parseHousePhrase(
  raw: string,
  sessionId: string,
  generatedAt: string,
): HousePhrase | null {
  if (!raw || typeof raw !== 'string') return null;
  const parts = raw.trim().split(' · ');
  if (parts.length !== 3) return null;
  const [word1, word2, word3] = parts;
  if (!word1 || !word2 || !word3) return null;
  // Each word must be 3–12 uppercase ASCII letters (the word list guarantee)
  const wordOk = (w: string) => /^[A-Z]{3,12}$/.test(w);
  if (!wordOk(word1) || !wordOk(word2) || !wordOk(word3)) return null;
  return { word1, word2, word3, display: raw.trim(), sessionId, generatedAt };
}

/**
 * Verify that the user's confirmed phrase matches what the server sent
 * and that the phrase hasn't expired.
 *
 * This is called when the user taps "Phrases Match" in The Key Ceremony™.
 */
export function verifyHousePhrase(
  phrase: HousePhrase,
  userConfirmedDisplay: string,
): PhraseVerdict {
  // 1. Expiry check
  const age = Date.now() - new Date(phrase.generatedAt).getTime();
  if (isNaN(age) || age > PHRASE_TTL_MS) {
    return { ok: false, reason: 'EXPIRED' };
  }
  // 2. Exact match (case-insensitive — user may have read lowercase)
  const normalise = (s: string) =>
    s.trim().toUpperCase().replace(/\s*[\u00b7\u2022\-]\s*/g, ' · ');
  if (normalise(userConfirmedDisplay) !== normalise(phrase.display)) {
    return { ok: false, reason: 'MISMATCH' };
  }
  return { ok: true, sessionId: phrase.sessionId };
}

/**
 * Format a House Phrase for large-text display in the pairing ceremony UI.
 * Renders as three stacked words with the separator character.
 */
export function formatHousePhraseForDisplay(phrase: HousePhrase): {
  lines: [string, string, string];
  separator: '·';
  ttlSeconds: number;
} {
  const ageMs = Date.now() - new Date(phrase.generatedAt).getTime();
  const remaining = Math.max(0, PHRASE_TTL_MS - ageMs);
  return {
    lines: [phrase.word1, phrase.word2, phrase.word3],
    separator: '·',
    ttlSeconds: Math.ceil(remaining / 1000),
  };
}

/**
 * Formats a user-readable description of the House Phrase ceremony for the
 * onboarding screen. Used in The Key Ceremony™ step header.
 */
export function getKeyCeremonyDescription(): {
  title:    string;
  subtitle: string;
  body:     string;
} {
  return {
    title:    'THE KEY CEREMONY™',
    subtitle: 'Both screens must show the same three words.',
    body:     'Your phone and your PC are showing a short phrase. ' +
              'If the words match, tap Confirm. ' +
              'If they differ, someone may be intercepting your connection — tap Abort.',
  };
}
