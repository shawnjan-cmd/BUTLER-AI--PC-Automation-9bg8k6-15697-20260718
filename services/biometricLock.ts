/**
 * Butler AI — Biometric Lock Service
 * Uses expo-local-authentication for Face ID / Touch ID / fingerprint.
 *
 * Features:
 *  - Lock on background after configurable timeout (default 60s)
 *  - Unlock with biometric OR 6-digit fallback PIN
 *  - Lock state persisted in AsyncStorage (survives app kill)
 *  - Emits events to any subscriber (BiometricLockOverlay listens)
 *  - Gracefully degrades when biometrics unavailable
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCK_ENABLED_KEY   = '@butler_biometric_lock_enabled_v1';
const LOCK_TIMEOUT_KEY   = '@butler_biometric_lock_timeout_v1';
const LOCK_STATE_KEY     = '@butler_biometric_lock_state_v1';
const PIN_HASH_KEY       = '@butler_biometric_pin_hash_v1';

export type BiometricType = 'FACE_ID' | 'TOUCH_ID' | 'FINGERPRINT' | 'NONE';
export type LockStatus = 'locked' | 'unlocked' | 'unavailable' | 'disabled';

export interface BiometricLockState {
  status:          LockStatus;
  biometricType:   BiometricType;
  isAvailable:     boolean;
  isEnabled:       boolean;
  timeoutSec:      number;
  lastUnlockedAt:  number;
  failedAttempts:  number;
  pinSet:          boolean;
}

let _LocalAuth: any = null;
function getLocalAuth() {
  if (_LocalAuth) return _LocalAuth;
  try { _LocalAuth = require('expo-local-authentication'); } catch { _LocalAuth = null; }
  return _LocalAuth;
}

type Listener = (state: BiometricLockState) => void;

class BiometricLockService {
  private static _instance: BiometricLockService;
  static getInstance() {
    if (!this._instance) this._instance = new BiometricLockService();
    return this._instance;
  }

  private _state: BiometricLockState = {
    status:         'disabled',
    biometricType:  'NONE',
    isAvailable:    false,
    isEnabled:      false,
    timeoutSec:     60,
    lastUnlockedAt: 0,
    failedAttempts: 0,
    pinSet:         false,
  };
  private _listeners: Set<Listener> = new Set();
  private _backgroundTime: number   = 0;
  private _initialized               = false;

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    fn({ ...this._state });
    return () => this._listeners.delete(fn);
  }

  private _emit() {
    this._listeners.forEach(fn => { try { fn({ ...this._state }); } catch {} });
  }

  getState(): BiometricLockState { return { ...this._state }; }

  // ── Boot init ────────────────────────────────────────────────
  async init(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    // Load persisted settings
    try {
      const [enabledRaw, timeoutRaw, pinHashRaw] = await AsyncStorage.multiGet([
        LOCK_ENABLED_KEY, LOCK_TIMEOUT_KEY, PIN_HASH_KEY,
      ]);
      this._state.isEnabled   = enabledRaw[1] === '1';
      this._state.timeoutSec  = parseInt(timeoutRaw[1] ?? '60', 10) || 60;
      this._state.pinSet      = !!pinHashRaw[1];
    } catch {}

    // Detect biometric hardware
    const la = getLocalAuth();
    if (la) {
      try {
        const hasHardware = await la.hasHardwareAsync();
        const isEnrolled  = await la.isEnrolledAsync();
        this._state.isAvailable = hasHardware && isEnrolled;
        const types: number[] = hasHardware
          ? await la.supportedAuthenticationTypesAsync().catch(() => [])
          : [];
        // Types: 1 = FINGERPRINT, 2 = FACIAL, 3 = IRIS
        if (types.includes(2)) this._state.biometricType = 'FACE_ID';
        else if (types.includes(1)) this._state.biometricType = 'FINGERPRINT';
        else if (this._state.isAvailable) this._state.biometricType = 'TOUCH_ID';
      } catch {}
    }

    // Determine initial status
    if (!this._state.isEnabled) {
      this._state.status = 'disabled';
    } else if (!this._state.isAvailable && !this._state.pinSet) {
      this._state.status = 'unavailable';
    } else {
      // Check persisted lock state
      try {
        const raw = await AsyncStorage.getItem(LOCK_STATE_KEY);
        if (raw === 'locked') {
          this._state.status     = 'locked';
          this._state.lastUnlockedAt = 0;
        } else {
          this._state.status     = 'unlocked';
          this._state.lastUnlockedAt = Date.now();
        }
      } catch {
        this._state.status = 'unlocked';
        this._state.lastUnlockedAt = Date.now();
      }
    }

    this._emit();
  }

  // ── Called when app backgrounds (AppState = background) ─────
  onBackground(): void {
    this._backgroundTime = Date.now();
    if (this._state.isEnabled && this._state.status === 'unlocked') {
      // Persist lock state so if app is killed while backgrounded,
      // next cold start will show lock screen
      AsyncStorage.setItem(LOCK_STATE_KEY, 'locked').catch(() => {});
    }
  }

  // ── Called when app foregrounds (AppState = active) ──────────
  onForeground(): void {
    if (!this._state.isEnabled || this._state.status === 'disabled') return;

    const bgDuration = Date.now() - this._backgroundTime;
    if (bgDuration >= this._state.timeoutSec * 1000) {
      this._state.status = 'locked';
      this._state.failedAttempts = 0;
      this._emit();
    }
  }

  // ── Attempt biometric unlock ──────────────────────────────────
  async unlockWithBiometric(): Promise<{ success: boolean; error?: string }> {
    if (!this._state.isAvailable) {
      return { success: false, error: 'Biometrics not available' };
    }

    const la = getLocalAuth();
    if (!la) return { success: false, error: 'expo-local-authentication not installed' };

    try {
      const result = await la.authenticateAsync({
        promptMessage: 'Unlock Butler AI',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        this._state.status         = 'unlocked';
        this._state.lastUnlockedAt = Date.now();
        this._state.failedAttempts = 0;
        await AsyncStorage.setItem(LOCK_STATE_KEY, 'unlocked').catch(() => {});
        this._emit();
        return { success: true };
      } else {
        this._state.failedAttempts++;
        this._emit();
        return { success: false, error: result.error ?? 'Authentication failed' };
      }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Unknown error' };
    }
  }

  // ── Attempt PIN unlock ────────────────────────────────────────
  async unlockWithPIN(pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storedHash = await AsyncStorage.getItem(PIN_HASH_KEY);
      if (!storedHash) return { success: false, error: 'No PIN set' };

      const pinHash = await hashPIN(pin);
      if (pinHash === storedHash) {
        this._state.status         = 'unlocked';
        this._state.lastUnlockedAt = Date.now();
        this._state.failedAttempts = 0;
        await AsyncStorage.setItem(LOCK_STATE_KEY, 'unlocked').catch(() => {});
        this._emit();
        return { success: true };
      } else {
        this._state.failedAttempts++;
        this._emit();
        return { success: false, error: 'Incorrect PIN' };
      }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Error' };
    }
  }

  // ── Set/change PIN ────────────────────────────────────────────
  async setPIN(pin: string): Promise<void> {
    const hash = await hashPIN(pin);
    await AsyncStorage.setItem(PIN_HASH_KEY, hash);
    this._state.pinSet = true;
    this._emit();
  }

  async clearPIN(): Promise<void> {
    await AsyncStorage.removeItem(PIN_HASH_KEY).catch(() => {});
    this._state.pinSet = false;
    this._emit();
  }

  // ── Enable / disable lock ─────────────────────────────────────
  async setEnabled(enabled: boolean): Promise<void> {
    this._state.isEnabled = enabled;
    await AsyncStorage.setItem(LOCK_ENABLED_KEY, enabled ? '1' : '0').catch(() => {});
    if (!enabled) {
      this._state.status = 'disabled';
      await AsyncStorage.setItem(LOCK_STATE_KEY, 'unlocked').catch(() => {});
    } else {
      this._state.status = 'unlocked';
      this._state.lastUnlockedAt = Date.now();
    }
    this._emit();
  }

  // ── Set timeout ───────────────────────────────────────────────
  async setTimeout(sec: number): Promise<void> {
    this._state.timeoutSec = sec;
    await AsyncStorage.setItem(LOCK_TIMEOUT_KEY, String(sec)).catch(() => {});
    this._emit();
  }

  // ── Force lock ────────────────────────────────────────────────
  async forceLock(): Promise<void> {
    if (!this._state.isEnabled) return;
    this._state.status = 'locked';
    this._state.failedAttempts = 0;
    await AsyncStorage.setItem(LOCK_STATE_KEY, 'locked').catch(() => {});
    this._emit();
  }
}

// ── Lightweight PIN hash (no crypto library needed) ───────────────
async function hashPIN(pin: string): Promise<string> {
  try {
    const { digestStringAsync, CryptoDigestAlgorithm } = require('expo-crypto');
    return await digestStringAsync(CryptoDigestAlgorithm.SHA256, `butler_pin_salt_v1:${pin}`);
  } catch {
    // Fallback: simple checksum (better than nothing if expo-crypto fails)
    let h = 5381;
    for (let i = 0; i < pin.length; i++) h = ((h << 5) + h) + pin.charCodeAt(i);
    return String(Math.abs(h));
  }
}

export const biometricLock = BiometricLockService.getInstance();
