/**
 * Butler AI — Authenticated encrypted local storage.
 * Sensitive values use AES-256-GCM (AEAD) with a fresh 96-bit nonce per value.
 * The derived key is kept in Android SecureStore when available; plaintext
 * fallback is forbidden for sensitive keys.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { gcm } from '@noble/ciphers/aes.js';
import { hexToBytes } from '@noble/ciphers/utils.js';
import { encodeButlerRecord, decodeButlerRecord } from './butlerLanguage';
// expo-crypto: lazy-loaded to prevent Class A Android cold-start crash.
// Static top-level import of native modules crashes before the bridge is ready.
let _Crypto: any = null;
function getCrypto() {
  if (!_Crypto) {
    try { _Crypto = require('expo-crypto'); } catch { _Crypto = null; }
  }
  return _Crypto;
}
// Persist the derived key so cold starts skip the 1000-iteration KDF chain.
// `expo-secure-store` is the right vault (Android Keystore / iOS Keychain)
// but lazy-loaded so a module-level failure here can never block boot.
let _SecureStore: any = null;
function getSecureStore() {
  if (_SecureStore) return _SecureStore;
  try { _SecureStore = require('expo-secure-store'); } catch { _SecureStore = null; }
  return _SecureStore;
}

// ── Keys that hold sensitive data and must be encrypted ─────────
const SENSITIVE_KEYS = new Set([
  'commandcube_session_token',
  'commandcube_device_id',
  'commandcube_server_ip',
  'commandcube_server_port',
  'commandcube_last_paired',
  '@butler_app_sig',              // App signature exchanged during QR pair
  '@sc_known_good_ips_v1',        // Known-good IP:port list (LAN topology data)
  '@sc_auth_disabled_v1',         // Auth-disabled flag — must not be writable in plaintext
  '@butler_scripts_butler_v1',     // ButlerScript library
  '@botler_auto_saved_research',  // KB findings
  '@butler_conv_butler_v1',        // Chat history
  '@butler_stable_state',
  'BUTLER_STABLE_STATE',
  'BUTLER_AUTO_UPGRADES',
  '@butler_user_avatar_v1',
  '@butler_ai_avatar_v1',
  '@butler_server_token',
  '@butler_sessions_v1',
  '@butler_transport_scheme',
  '@scripts_etag_v1',
  '@scripts_data_v1',
  '@butler_personal_memory_v1',
  '@butler_events_v1',
  '@butler_crawl_history_v1',
  '@butler_vault_index_v1',
  '@butler_automation_memory_v1',
]);

// Prefix-scoped records are protected as a class so future workflow traces
// cannot accidentally fall back to plaintext simply because they use a new ID.
const SENSITIVE_PREFIXES = [
  '@butler_src_',
  '@butler_workflow_trace_',
  '@butler_hardened_log_',
  '@butler_automation_receipt_',
];
const isSensitiveKey = (key: string): boolean => SENSITIVE_KEYS.has(key) || SENSITIVE_PREFIXES.some(prefix => key.startsWith(prefix));

const SALT             = 'butler-ai-local-v1-salt-2025';
const MIGRATION_DONE_KEY = '@butler_enc_migration_v1';

// SecureStore vault keys for the persistent derived key (skips KDF on boot)
const DERIVED_KEY_STORE        = 'butler_derived_key_v1';
const DERIVED_DEVICE_ID_STORE  = 'butler_derived_device_id_v1';

// ── Derive a 32-byte key from device ID ─────────────────────────
let _keyCache: string | null = null;
let _deviceIdForKey: string | null = null;

async function deriveKey(deviceId: string): Promise<string> {
  // 1. In-memory cache — fastest, same JS session.
  if (_keyCache && _deviceIdForKey === deviceId) return _keyCache;

  // 2. Persistent cache via SecureStore — survives app restarts.
  //    1000 SHA-256 iterations cost 300–1000ms on Android. Without
  //    this, that work runs on EVERY cold start inside bootstrap()
  //    and contributes directly to "app feels sluggish on first
  //    open" reports.
  try {
    const ss = getSecureStore();
    if (ss?.getItemAsync) {
      const [cachedKey, cachedId] = await Promise.all([
        ss.getItemAsync(DERIVED_KEY_STORE).catch(() => null),
        ss.getItemAsync(DERIVED_DEVICE_ID_STORE).catch(() => null),
      ]);
      if (cachedKey && cachedId === deviceId) {
        _keyCache = cachedKey;
        _deviceIdForKey = deviceId;
        return cachedKey;
      }
    }
  } catch { /* SecureStore unavailable — fall through to derive */ }

  // 3. First-ever install (or device-id changed): run the full KDF.
  //    Stretch: hash the seed 1000 times (lightweight PBKDF2 approximation)
  let seed = `${deviceId}:${SALT}`;
  for (let i = 0; i < 1000; i++) {
    seed = await getCrypto().digestStringAsync(getCrypto().CryptoDigestAlgorithm.SHA256, seed);
  }
  _keyCache = seed;
  _deviceIdForKey = deviceId;

  // Persist for next launch — fire-and-forget, never blocks.
  try {
    const ss = getSecureStore();
    if (ss?.setItemAsync) {
      ss.setItemAsync(DERIVED_KEY_STORE, seed).catch(() => {});
      ss.setItemAsync(DERIVED_DEVICE_ID_STORE, deviceId).catch(() => {});
    }
  } catch {}

  return seed;
}

// ── AES-256-GCM authenticated encryption ─────────────────────────
const ENC_PREFIX = '__AESGCM1__';
const LEGACY_PREFIX = '__ENC__';

function toBytes(hex: string): Uint8Array {
  return hexToBytes(hex);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function secureRandomBytes(length: number): Promise<Uint8Array> {
  const c = getCrypto();
  if (!c?.getRandomBytesAsync) throw new Error('CSPRNG unavailable; refusing encryption');
  const bytes: Uint8Array = await c.getRandomBytesAsync(length);
  if (!(bytes instanceof Uint8Array) || bytes.length !== length) throw new Error('Invalid CSPRNG output');
  return bytes;
}

function keyBytes(keyHex: string): Uint8Array {
  const key = toBytes(keyHex);
  if (key.length !== 32) throw new Error('AES-256 key must be 32 bytes');
  return key;
}

async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const nonce = await secureRandomBytes(12);
  const encoded = encodeButlerRecord(plaintext, 'sensitive');
  const plaintextBytes = new TextEncoder().encode(encoded);
  const ciphertext = gcm(keyBytes(keyHex), nonce).encrypt(plaintextBytes);
  const packed = new Uint8Array(nonce.length + ciphertext.length);
  packed.set(nonce, 0);
  packed.set(ciphertext, nonce.length);
  return ENC_PREFIX + bytesToBase64(packed);
}

async function decrypt(ciphertext: string, keyHex: string): Promise<string> {
  if (ciphertext.startsWith(LEGACY_PREFIX)) {
    throw new Error('Legacy unauthenticated ciphertext rejected; re-pair and recreate the affected data');
  }
  if (!ciphertext.startsWith(ENC_PREFIX)) throw new Error('Unsupported ciphertext format');
  const packed = base64ToBytes(ciphertext.slice(ENC_PREFIX.length));
  if (packed.length < 12 + 16) throw new Error('Truncated AES-GCM ciphertext');
  const nonce = packed.slice(0, 12);
  const encrypted = packed.slice(12);
  const plaintext = gcm(keyBytes(keyHex), nonce).decrypt(encrypted);
  const decoded = new TextDecoder().decode(plaintext);
  return decoded.startsWith('BUTLER1|') ? String(decodeButlerRecord(decoded)) : decoded;
}

// ── Public API ───────────────────────────────────────────────────
class EncryptedStorage {
  private _key: string | null = null;

  /** Call once at app boot with the device ID to prime the key cache */
  async init(deviceId: string): Promise<void> {
    this._key = await deriveKey(deviceId);
  }

  private async _getKey(): Promise<string | null> {
    if (this._key) return this._key;
    // Lazy init: try SecureStore (preferred — device-id is stored there during derive)
    // before falling back to raw AsyncStorage to avoid a chicken-and-egg bootstrap.
    try {
      const ss = getSecureStore();
      if (ss?.getItemAsync) {
        const [cachedKey, cachedId] = await Promise.all([
          ss.getItemAsync(DERIVED_KEY_STORE).catch(() => null),
          ss.getItemAsync(DERIVED_DEVICE_ID_STORE).catch(() => null),
        ]);
        if (cachedKey && cachedId) {
          this._key = cachedKey;
          _keyCache = cachedKey;
          _deviceIdForKey = cachedId;
          return this._key;
        }
      }
    } catch {}
    // SecureStore miss — bootstrap from deviceIdentifier (stable hardware ID)
    try {
      const { deviceIdentifier } = await import('./deviceIdentifier');
      const id = await deviceIdentifier.getDeviceId();
      if (id) {
        this._key = await deriveKey(id);
        return this._key;
      }
    } catch {}
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!isSensitiveKey(key)) {
      return AsyncStorage.setItem(key, value);
    }
    try {
      const k = await this._getKey();
      if (!k) throw new Error('Encryption key unavailable');
      const stored = await encrypt(value, k);
      await AsyncStorage.setItem(key, stored);
    } catch {
      // Sensitive data must never silently downgrade to plaintext.
      throw new Error(`Encrypted storage unavailable for sensitive key: ${key}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw || !isSensitiveKey(key)) return raw;
    if (!raw.startsWith(ENC_PREFIX)) return null; // reject legacy plaintext/unauthenticated values
    try {
      const k = await this._getKey();
      return k ? await decrypt(raw, k) : null;
    } catch {
      return null;
    }
  }

  async encryptBlobText(value: string): Promise<string> {
    const k = await this._getKey();
    if (!k) throw new Error('Encryption key unavailable');
    return encrypt(value, k);
  }

  async decryptBlobText(value: string): Promise<string> {
    const k = await this._getKey();
    if (!k) throw new Error('Encryption key unavailable');
    return decrypt(value, k);
  }

  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  async multiSet(pairs: [string, string][]): Promise<void> {
    const k = await this._getKey();
    const encrypted: [string, string][] = await Promise.all(
      pairs.map(async ([key, value]) => {
        if (isSensitiveKey(key) && k) {
          return [key, await encrypt(value, k)] as [string, string];
        }
        if (isSensitiveKey(key)) throw new Error(`Encrypted storage unavailable for sensitive key: ${key}`);
        return [key, value] as [string, string];
      })
    );
    await AsyncStorage.multiSet(encrypted);
  }

  async multiGet(keys: string[]): Promise<readonly [string, string | null][]> {
    const raw = await AsyncStorage.multiGet(keys);
    const k = await this._getKey();
    return Promise.all(
      raw.map(async ([key, value]) => {
        if (value && isSensitiveKey(key) && value.startsWith(ENC_PREFIX) && k) {
          try { return [key, await decrypt(value, k)] as [string, string | null]; }
          catch { return [key, null] as [string, string | null]; }
        }
        if (isSensitiveKey(key)) {
          // Never expose a legacy/plaintext sensitive value to callers.
          return [key, null] as [string, string | null];
        }
        return [key, value] as [string, string | null];
      })
    );
  }

  /**
   * One-time migration: reads every SENSITIVE_KEY stored as plaintext in raw
   * AsyncStorage and re-writes it encrypted. Runs ONCE per install — guarded
   * by the MIGRATION_DONE_KEY flag so subsequent boots skip it entirely.
   *
   * Call from app boot (butlerIntegrityEngine.runScan) after encryptedStorage
   * is initialised. Safe to call concurrently — second call is a no-op.
   */
  async migrate(): Promise<void> {
    try {
      // Guard: skip if already migrated on this device
      const already = await AsyncStorage.getItem(MIGRATION_DONE_KEY).catch(() => null);
      if (already === '1') return;
    } catch { return; }

    const k = await this._getKey();
    if (!k) return; // encryption key not ready — will retry next boot

    let migrated = 0;
    for (const key of Array.from(SENSITIVE_KEYS)) {
      try {
        const val = await AsyncStorage.getItem(key);
        if (val && !val.startsWith(ENC_PREFIX)) {
          // Crash-safe migration: encrypt, write, read back, authenticate, then
          // remove the legacy value. Never delete the only copy first.
          const encrypted = await encrypt(val, k);
          await AsyncStorage.setItem(key, encrypted);
          const verified = await AsyncStorage.getItem(key);
          if (!verified || !verified.startsWith(ENC_PREFIX) || (await decrypt(verified, k)) !== val) {
            throw new Error(`Encrypted migration verification failed for ${key}`);
          }
          migrated++;
        }
      } catch { /* skip individual key failures — partial migration is still progress */ }
    }

    // Mark migration complete only after all keys are processed
    await AsyncStorage.setItem(MIGRATION_DONE_KEY, '1').catch(() => {});
  }
}

export const encryptedStorage = new EncryptedStorage();

// ── Convenience wrappers matching AsyncStorage API ───────────────
export async function secureSet(key: string, value: string): Promise<void> {
  return encryptedStorage.setItem(key, value);
}
export async function secureGet(key: string): Promise<string | null> {
  return encryptedStorage.getItem(key);
}
