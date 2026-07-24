/**
 * storageGuard.ts — quota-safe AsyncStorage wrapper.
 * Degrades gracefully when the 6MB Android cursor/quota is hit.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENDABLE_PREFIXES = [
  '@butler_cache_', '@perf_history_', '@corrupt_', '@butler_kb_preview_',
];

export async function guardedSet(key: string, value: string): Promise<boolean> {
  try { await AsyncStorage.setItem(key, value); return true; }
  catch {
    await purgeExpendableCache();
    try { await AsyncStorage.setItem(key, value); return true; }
    catch { return false; }
  }
}

export async function purgeExpendableCache(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const victims = keys.filter(k => EXPENDABLE_PREFIXES.some(p => k.startsWith(p)));
    if (victims.length) await AsyncStorage.multiRemove(victims);
    return victims.length;
  } catch { return 0; }
}
