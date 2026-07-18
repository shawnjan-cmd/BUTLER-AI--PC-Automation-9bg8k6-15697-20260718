/**
 * safeClipboard.ts — Butler AI v1.1
 *
 * RN 0.68+ removed Clipboard from react-native core — static top-level imports
 * resolve to `undefined` on Android and crash with "undefined is not a function".
 * This shared helper uses lazy require() so it only resolves at call time,
 * with AsyncStorage as a persistent fallback (clipboard history ring buffer).
 *
 * Usage:
 *   import { safeSetClipboard, safeGetClipboard } from '@/services/safeClipboard';
 *   await safeSetClipboard('text');
 *   const text = await safeGetClipboard();
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_KEY = '@butler_safe_clipboard_v1';

/** Try to get the native RN Clipboard module (lazy — never crashes at module load) */
function getClipboardModule(): any {
  try {
    const RNC = (require('react-native') as any).Clipboard;
    if (typeof RNC?.setString === 'function') return RNC;
  } catch {}
  return null;
}

/**
 * Set clipboard text. Falls back to AsyncStorage so the text is
 * retrievable even if the native Clipboard API is unavailable.
 */
export async function safeSetClipboard(text: string): Promise<void> {
  // 1. Try native clipboard
  try {
    const RNC = getClipboardModule();
    if (RNC) { RNC.setString(String(text)); }
  } catch {}
  // 2. Always persist to AsyncStorage as fallback
  try {
    await AsyncStorage.setItem(FALLBACK_KEY, String(text));
  } catch {}
}

/**
 * Get clipboard text. Tries native clipboard first,
 * falls back to the last value written via safeSetClipboard.
 */
export async function safeGetClipboard(): Promise<string> {
  // 1. Try native clipboard
  try {
    const RNC = getClipboardModule();
    if (RNC) {
      return await new Promise<string>((res) => {
        RNC.getString().then((v: string) => res(v || '')).catch(() => res(''));
      });
    }
  } catch {}
  // 2. AsyncStorage fallback
  try {
    const val = await AsyncStorage.getItem(FALLBACK_KEY);
    return val || '';
  } catch {}
  return '';
}
