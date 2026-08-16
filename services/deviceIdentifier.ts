/**
 * Butler AI — app-install identifier.
 *
 * The identifier exists only to scope a paired-PC session to this installation.
 * It is a random, app-private value: no device attributes, advertising IDs, or
 * hardware-derived fingerprints are read or retained.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_ID_KEY = '@butler_install_id_v2';
const LEGACY_DEVICE_KEY = 'commandcube_device_id';
const LEGACY_AT_DEVICE_KEY = '@commandcube_device_id';
const PREFIX = 'butler-install-';

function isInstallId(value: string | null): value is string {
  return !!value && /^butler-install-[a-f0-9]{32}$/i.test(value);
}

async function createInstallId(): Promise<string> {
  const Crypto = await import('expo-crypto');
  const bytes = await Crypto.getRandomBytesAsync(16);
  if (!(bytes instanceof Uint8Array) || bytes.length !== 16) {
    throw new Error('CSPRNG unavailable; refusing to create an install identifier');
  }
  return PREFIX + Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

class DeviceIdentifierService {
  private deviceId: string | null = null;

  /** Returns an app-install-scoped random ID. It resets on uninstall or explicit reset. */
  async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;

    const saved = await AsyncStorage.getItem(INSTALL_ID_KEY).catch(() => null);
    if (isInstallId(saved)) {
      this.deviceId = saved;
      return saved;
    }

    const id = await createInstallId();
    await AsyncStorage.setItem(INSTALL_ID_KEY, id).catch(() => {});
    // Do not migrate prior hardware-derived identifiers. The paired-PC gateway
    // detects the rotation and intentionally clears its old session token.
    await AsyncStorage.removeItem(LEGACY_AT_DEVICE_KEY).catch(() => {});
    this.deviceId = id;
    return id;
  }

  resetCache(): void {
    this.deviceId = null;
  }

  /** Explicit user-controlled reset for re-pairing this app installation. */
  async clearDeviceId(): Promise<void> {
    await AsyncStorage.multiRemove([INSTALL_ID_KEY, LEGACY_AT_DEVICE_KEY]).catch(() => {});
    this.deviceId = null;
  }

  /** Compatibility diagnostic: hardware fingerprinting is intentionally unsupported. */
  async getHardwareFingerprint(): Promise<string | null> {
    return null;
  }
}

export const deviceIdentifier = new DeviceIdentifierService();
export const LEGACY_DEVICE_ID_STORAGE_KEY = LEGACY_DEVICE_KEY;
