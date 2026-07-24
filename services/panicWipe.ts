/**
 * panicWipe.ts — user-controlled full local data erase.
 * Settings → DANGER ZONE → "WIPE ALL LOCAL DATA"
 *
 * Section 22.16 of Butler AI Master Instructions v9.0
 * Gate with hold-to-confirm (3s) + type "WIPE" before calling.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function panicWipe(): Promise<void> {
  // 1. Clear all AsyncStorage — wipes every cache, preference, and user key.
  try { await AsyncStorage.clear(); } catch {}

  // 2. Delete SecureStore keys (derived encryption key + device ID).
  try {
    const SecureStore = require('expo-secure-store');
    const SECURE_KEYS = [
      'butler_derived_key_v1',
      'butler_derived_device_id_v1',
      '@butler_server_identity_v1',
    ];
    await Promise.allSettled(
      SECURE_KEYS.map(k => SecureStore.deleteItemAsync(k).catch(() => {}))
    );
  } catch {}

  // 3. Reset in-memory singletons via their own clear methods.
  try {
    const { scriptUndo } = require('@/services/scriptUndo');
    scriptUndo?.clearAll?.();
  } catch {}

  try {
    const { knowledgeAccumulator } = require('@/services/knowledgeAccumulator');
    knowledgeAccumulator?.clearAll?.();
  } catch {}

  // 4. Clear any in-memory chat history / session state.
  try {
    const { connectionHub } = require('@/services/connectionHub');
    connectionHub?.disconnect?.();
  } catch {}
}
