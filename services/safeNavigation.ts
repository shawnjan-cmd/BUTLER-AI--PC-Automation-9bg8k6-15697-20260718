/**
 * Butler AI — Safe Navigation Gate
 *
 * UI code can navigate only to a fixed internal route or a named, allow-listed
 * external destination. Raw routes and raw URLs from chat, memory, server data,
 * or scripts are never accepted as redirect targets.
 */

import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { aiLogger } from './aiLogger';

const INTERNAL_ROUTES = new Set([
  '/(tabs)/home', '/(tabs)/butler', '/(tabs)/scripts', '/(tabs)/connect',
  '/(tabs)/serverSetup', '/(tabs)/settings', '/(tabs)/knowledge', '/(tabs)/tools',
]);

const EXTERNAL_DESTINATIONS = {
  tailscale_download: {
    label: 'Tailscale download',
    url: 'https://tailscale.com/download',
  },
  butler_server_release: {
    label: 'Butler Server release',
    url: 'https://github.com/shawnjan-cmd/butler-server/releases/latest',
  },
  butler_project: {
    label: 'Butler AI project page',
    url: 'https://github.com/butlerai/butler-ai-pc-automation',
  },
} as const;

export type ButlerRoute = keyof typeof INTERNAL_ROUTE_NAMES;
export type ButlerExternalDestination = keyof typeof EXTERNAL_DESTINATIONS;

const INTERNAL_ROUTE_NAMES = {
  home: '/(tabs)/home',
  butler: '/(tabs)/butler',
  scripts: '/(tabs)/scripts',
  connect: '/(tabs)/connect',
  serverSetup: '/(tabs)/serverSetup',
  settings: '/(tabs)/settings',
  knowledge: '/(tabs)/knowledge',
  tools: '/(tabs)/tools',
} as const;

export function navigateButler(destination: ButlerRoute, replace = false): boolean {
  const route = INTERNAL_ROUTE_NAMES[destination];
  if (!route || !INTERNAL_ROUTES.has(route)) {
    aiLogger.warn('Navigation rejected by internal route allow-list', { destination });
    return false;
  }
  try {
    if (replace) router.replace(route as any);
    else router.push(route as any);
    aiLogger.info('Internal Butler navigation completed', { destination });
    return true;
  } catch {
    aiLogger.warn('Internal Butler navigation failed', { destination });
    return false;
  }
}

export async function openButlerExternal(destination: ButlerExternalDestination, confirm = true): Promise<boolean> {
  const record = EXTERNAL_DESTINATIONS[destination];
  if (!record) {
    aiLogger.warn('External navigation rejected by destination allow-list', { destination });
    return false;
  }
  const proceed = async (): Promise<boolean> => {
    try {
      const allowed = await Linking.canOpenURL(record.url);
      if (!allowed) throw new Error('Unsupported destination');
      await Linking.openURL(record.url);
      aiLogger.info('Trusted external destination opened', { destination });
      return true;
    } catch {
      aiLogger.warn('Trusted external destination could not be opened', { destination });
      return false;
    }
  };
  if (!confirm) return proceed();
  return new Promise(resolve => {
    Alert.alert('Open trusted destination?', `${record.label} opens outside Butler AI.`, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Open', onPress: () => { proceed().then(resolve); } },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

export const BUTLER_INTERNAL_ROUTE_NAMES = INTERNAL_ROUTE_NAMES;
