/**
 * inputGuards.ts — every TextInput in the app runs its value through these.
 * Prevents: paste bombs, zero-width spoofing, ANSI escapes, control chars.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */

export const INPUT_LIMITS = {
  chat:        8_000,
  clipboard: 100_000,
  search:        200,
  scriptName:     64,
  scriptBody: 200_000,
  manualIp:       15,
  manualPort:      5,
  pairingCode:    64,
} as const;

export function sanitizeInput(raw: string, limit: number): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\u200B-\u200F\u2060\uFEFF]/g, '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
    .slice(0, limit);
}
