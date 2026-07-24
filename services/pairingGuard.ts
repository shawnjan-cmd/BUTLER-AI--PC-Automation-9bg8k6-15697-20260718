/**
 * pairingGuard.ts — validates a parsed QR/manual connection target
 * BEFORE any network request is made to it.
 * Butler is LAN-only by design; a pairing target outside private IP
 * space is either a typo or an attack. Block by default.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */

export type PairingVerdict =
  | { ok: true }
  | { ok: true; warn: string }
  | { ok: false; reason: string };

const PRIVATE_RANGES: Array<[RegExp, string]> = [
  [/^10\./,                         'RFC1918 10.0.0.0/8'],
  [/^192\.168\./,                   'RFC1918 192.168.0.0/16'],
  [/^172\.(1[6-9]|2\d|3[01])\./,    'RFC1918 172.16.0.0/12'],
  [/^169\.254\./,                   'link-local 169.254.0.0/16'],
];

const OVERRIDE_RANGES: Array<[RegExp, string]> = [
  [/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, 'CGNAT/Tailscale 100.64.0.0/10'],
];

export function validatePairingTarget(ip: string, port: string): PairingVerdict {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => !Number.isInteger(o) || o < 0 || o > 255))
    return { ok: false, reason: 'Malformed IP address in QR code.' };

  const p = Number(port);
  if (!Number.isInteger(p) || p < 1 || p > 65535)
    return { ok: false, reason: 'Invalid port in QR code.' };

  if (ip === '0.0.0.0')
    return { ok: false, reason: 'Wildcard address is not a server.' };
  if (/^127\./.test(ip))
    return { ok: false, reason: 'Loopback points at the PHONE, not your PC.' };
  if (/^(22[4-9]|23\d)\./.test(ip))
    return { ok: false, reason: 'Multicast address — not a server.' };
  if (octets[3] === 255)
    return { ok: false, reason: 'Broadcast address — not a server.' };

  if (PRIVATE_RANGES.some(([re]) => re.test(ip))) return { ok: true };

  const ov = OVERRIDE_RANGES.find(([re]) => re.test(ip));
  if (ov) return { ok: true, warn: `Non-LAN range (${ov[1]}). Only continue if you use Tailscale/VPN.` };

  return {
    ok: false,
    reason: `${ip} is a PUBLIC internet address. Butler pairs over your local network only. ` +
      `A QR pointing outside your LAN is a typo — or someone trying to steal your pairing.`,
  };
}
