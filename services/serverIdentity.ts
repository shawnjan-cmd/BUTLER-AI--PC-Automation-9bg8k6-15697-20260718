/**
 * serverIdentity.ts — Trust-on-first-use (TOFU) server identity check.
 * Detects if the paired PC has been replaced (or a MITM is impersonating it).
 *
 * Section 22.15 of Butler AI Master Instructions v9.0
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@butler_server_identity_v1';

export interface ServerIdentity {
  ip:       string;
  appSig:   string;
  pairedAt: number;
}

export type IdentityCheck = 'first_pair' | 'match' | 'CHANGED' | 'STALE';

/** Persist the identity of the server after a successful pairing. */
export async function rememberIdentity(ip: string, appSig: string): Promise<void> {
  try {
    const payload: ServerIdentity = { ip, appSig, pairedAt: Date.now() };
    await AsyncStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

/** Check the current server's identity against the stored one. */
export async function checkIdentity(ip: string, appSig: string): Promise<IdentityCheck> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return 'first_pair';
    const saved: ServerIdentity = JSON.parse(raw);

    // Signature mismatch → possible MITM or server reinstall
    if (saved.appSig && appSig && saved.appSig !== appSig) return 'CHANGED';

    // Stale pairing (>30 days) → recommend re-pair
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - saved.pairedAt > THIRTY_DAYS) return 'STALE';

    return 'match';
  } catch {
    return 'first_pair';
  }
}

/** Clear stored identity (called on un-pair or panic wipe). */
export async function clearIdentity(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
