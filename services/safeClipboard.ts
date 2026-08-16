import * as ExpoClipboard from 'expo-clipboard';

export async function safeSetClipboard(text: string): Promise<void> {
  try {
    await ExpoClipboard.setStringAsync(text);
  } catch {}
}

export async function safeGetClipboard(): Promise<string> {
  try {
    return await ExpoClipboard.getStringAsync();
  } catch {
    return '';
  }
}
