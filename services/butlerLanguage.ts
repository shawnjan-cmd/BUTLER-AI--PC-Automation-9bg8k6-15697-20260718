import { gcm } from '@noble/ciphers/aes.js';
import { hexToBytes } from '@noble/ciphers/utils.js';

const PREFIX = 'BUTLER1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function b64url(bytes: Uint8Array): string {
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded); const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function keyBytes(keyHex: string): Uint8Array {
  const bytes = hexToBytes(keyHex); if (bytes.length !== 32) throw new Error('BUTLER_LANGUAGE_KEY_INVALID'); return bytes;
}

/** Encodes data into a stable tagged record. This is not encryption by itself. */
export function encodeButlerRecord(value: unknown, kind = 'memory'): string {
  const json = JSON.stringify(value);
  if (typeof json !== 'string') throw new Error('BUTLER_LANGUAGE_UNSERIALIZABLE');
  const body = b64url(encoder.encode(json));
  return `${PREFIX}|${kind}|${body}`;
}

export function decodeButlerRecord(record: string): unknown {
  const [prefix, kind, body] = String(record).split('|');
  if (prefix !== PREFIX || !kind || !body) throw new Error('BUTLER_LANGUAGE_INVALID');
  return JSON.parse(decoder.decode(fromB64url(body)));
}

/** Encrypts a BUTLER record with AES-256-GCM; nonce is fresh per record. */
export async function sealButlerRecord(value: unknown, keyHex: string, nonce: Uint8Array): Promise<string> {
  if (nonce.length !== 12) throw new Error('BUTLER_LANGUAGE_NONCE_INVALID');
  const encoded = encodeButlerRecord(value);
  const encrypted = gcm(keyBytes(keyHex), nonce).encrypt(encoder.encode(encoded));
  const packed = new Uint8Array(nonce.length + encrypted.length); packed.set(nonce); packed.set(encrypted, nonce.length);
  return `${PREFIX}-SEALED|${b64url(packed)}`;
}

export function openButlerRecord(sealed: string, keyHex: string): unknown {
  if (!sealed.startsWith(`${PREFIX}-SEALED|`)) throw new Error('BUTLER_LANGUAGE_SEALED_INVALID');
  const packed = fromB64url(sealed.slice(`${PREFIX}-SEALED|`.length));
  if (packed.length < 28) throw new Error('BUTLER_LANGUAGE_SEALED_TRUNCATED');
  const plain = gcm(keyBytes(keyHex), packed.slice(0, 12)).decrypt(packed.slice(12));
  return decodeButlerRecord(decoder.decode(plain));
}

export const BUTLER_LANGUAGE_SPEC = Object.freeze({
  version: 1,
  purpose: 'compact tagged representation inside authenticated encryption',
  warning: 'The encoding is not a security boundary; AES-256-GCM and key protection are the security boundary.',
});
