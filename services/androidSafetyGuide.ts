import { Linking, Platform } from 'react-native';

export type AndroidSafetyStep = {
  id: string;
  title: string;
  why: string;
  actionLabel: string;
  intent: string;
  tradeoff: string;
};

export const ANDROID_SAFETY_STEPS: readonly AndroidSafetyStep[] = Object.freeze([
  { id: 'privacy-dashboard', title: 'Review Privacy Dashboard', why: 'See which apps recently accessed camera, microphone, and location.', actionLabel: 'OPEN PRIVACY', intent: 'android.settings.PRIVACY_SETTINGS', tradeoff: 'Review first; do not disable emergency or accessibility features blindly.' },
  { id: 'app-permissions', title: 'Audit App Permissions', why: 'Set location to while-in-use, ask-every-time, or denied where appropriate.', actionLabel: 'OPEN APP SETTINGS', intent: 'android.settings.MANAGE_APPLICATIONS_SETTINGS', tradeoff: 'Some apps lose features when permissions are removed.' },
  { id: 'location', title: 'Review Location Services', why: 'Check global location, Location Accuracy, Wi-Fi scanning, Bluetooth scanning, and account Timeline settings.', actionLabel: 'OPEN LOCATION', intent: 'android.settings.LOCATION_SOURCE_SETTINGS', tradeoff: 'Turning off location can reduce navigation and emergency-location features.' },
  { id: 'security', title: 'Check Security Updates', why: 'Install Android and manufacturer security updates and keep Play Protect enabled.', actionLabel: 'OPEN SECURITY', intent: 'android.settings.SECURITY_SETTINGS', tradeoff: 'Updates may require a restart and temporary battery use.' },
  { id: 'battery', title: 'Review Background Battery', why: 'Identify apps with unexpected background activity instead of disabling Butler blindly.', actionLabel: 'OPEN BATTERY', intent: 'android.settings.BATTERY_SAVER_SETTINGS', tradeoff: 'Aggressive battery restrictions can delay notifications and sync.' },
]);

export async function openAndroidSafetyIntent(intent: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try { await Linking.sendIntent(intent); return true; } catch {
    try { await Linking.openSettings(); return true; } catch { return false; }
  }
}

/** Explicit, visible assistance only. Butler never listens for a secret phrase,
 * records covertly, sends silent SMS, or calls police automatically. */
export async function openEmergencyDialer(number: string): Promise<boolean> {
  const safe = number.replace(/[^0-9+#*]/g, '').slice(0, 20);
  if (!safe) return false;
  return Linking.openURL(`tel:${safe}`).then(() => true).catch(() => false);
}

export async function openEmergencySms(number: string, message = 'I need help. Please call me.') : Promise<boolean> {
  const safe = number.replace(/[^0-9+#*]/g, '').slice(0, 20);
  if (!safe) return false;
  return Linking.openURL(`sms:${safe}?body=${encodeURIComponent(message.slice(0, 240))}`).then(() => true).catch(() => false);
}
