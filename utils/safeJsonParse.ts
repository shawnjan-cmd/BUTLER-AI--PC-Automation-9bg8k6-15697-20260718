/**
 * safeJsonParse.ts — JSON.parse that can never crash the app.
 * Returns the fallback on ANY failure and (optionally) quarantines
 * the corrupt payload for diagnostics instead of losing it.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    const v = JSON.parse(raw);
    return (v === null || v === undefined) ? fallback : v as T;
  } catch {
    return fallback;
  }
}

/** Parse + validate in one step. validate() should be cheap and synchronous. */
export function safeJsonParseChecked<T>(
  raw: string | null | undefined,
  fallback: T,
  validate: (v: unknown) => v is T,
): T {
  const v = safeJsonParse<unknown>(raw, fallback as unknown);
  return validate(v) ? v : fallback;
}

/**
 * For CRITICAL state keys: if the stored JSON is corrupt, move it to a
 * quarantine key (so nothing is silently lost) and return the fallback.
 * Prevents a corrupt blob from crash-looping the app forever.
 */
export async function safeJsonParseOrQuarantine<T>(
  storageKey: string, raw: string | null, fallback: T,
): Promise<T> {
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; }
  catch {
    try {
      await AsyncStorage.setItem(`@corrupt_${Date.now()}_${storageKey}`, raw.slice(0, 4096));
      await AsyncStorage.removeItem(storageKey);
    } catch {}
    return fallback;
  }
}
