/**
 * Butler AI — Private Data Policy Kernel
 *
 * Product-specific policy orchestration for local crawler, knowledge, and memory
 * records. Cryptographic protection is delegated to encryptedStorage and the
 * platform vault; this module never invents a cipher.
 */

export type DataScope = 'private' | 'device' | 'server' | 'session' | 'exportable';
export type Sensitivity = 'public' | 'internal' | 'personal' | 'secret';

export interface PrivacyMetadata {
  scope: DataScope;
  sensitivity: Sensitivity;
  confidence: number;
  capturedAt: string;
  retentionUntil?: string;
  sourceHash?: string;
  policyVersion: 'butler-privacy-v1';
}

const SECRET_PATTERNS: RegExp[] = [
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|secret)\s*[:=]\s*[^\s,;]+/gi,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\b(?:password|passwd|pwd)\s*[:=]\s*[^\s,;]+/gi,
];

export function redactSensitiveText(input: string): string {
  let output = String(input ?? '');
  for (const pattern of SECRET_PATTERNS) output = output.replace(pattern, '[REDACTED_SECRET]');
  return output;
}

/** Redaction for local diagnostics, which may contain connection details or credentials. */
export function redactDiagnosticText(input: string, maxLength = 500): string {
  let output = redactSensitiveText(String(input ?? ''));
  output = output
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/\bbutler-(?:hw|rnd|install)-[a-z0-9-]{8,}\b/gi, '[REDACTED_INSTALL_ID]')
    .replace(/\b(?:https?|wss?):\/\/[^\s'"`<>]+/gi, '[REDACTED_URL]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED_IP]');
  return output.slice(0, maxLength);
}

const DIAGNOSTIC_SECRET_KEYS = /(?:token|secret|password|passwd|auth(?:orization)?|cookie|session|device(?:id)?|ip|host|url|stack)/i;

/**
 * Produces a small, serialisable diagnostic record. Values that could reveal a
 * credential, local topology, or unique identifier are removed before storage.
 */
export function sanitizeDiagnosticMeta(meta: unknown, depth = 0): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta) || depth > 1) return undefined;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta as Record<string, unknown>).slice(0, 12)) {
    if (DIAGNOSTIC_SECRET_KEYS.test(key)) continue;
    if (typeof value === 'string') output[key.slice(0, 80)] = redactDiagnosticText(value, 180);
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) output[key.slice(0, 80)] = value;
    else if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = sanitizeDiagnosticMeta(value, depth + 1);
      if (nested && Object.keys(nested).length) output[key.slice(0, 80)] = nested;
    }
  }
  return Object.keys(output).length ? output : undefined;
}

export function classifyText(input: string): Sensitivity {
  const text = String(input ?? '');
  if (SECRET_PATTERNS.some(pattern => { pattern.lastIndex = 0; return pattern.test(text); })) return 'secret';
  if (/\b(?:email|phone|address|birthday|medical|passport|ssn|social security)\b/i.test(text)) return 'personal';
  if (/\b(?:internal|private|localhost|192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)\b/i.test(text)) return 'internal';
  return 'public';
}

export function buildPrivacyMetadata(input: {
  text: string;
  scope?: DataScope;
  confidence?: number;
  sourceHash?: string;
  retentionDays?: number;
}): PrivacyMetadata {
  const capturedAt = new Date().toISOString();
  const retentionUntil = input.retentionDays == null
    ? undefined
    : new Date(Date.now() + Math.max(1, input.retentionDays) * 86_400_000).toISOString();
  return {
    scope: input.scope ?? 'private',
    sensitivity: classifyText(input.text),
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.5)),
    capturedAt,
    retentionUntil,
    sourceHash: input.sourceHash,
    policyVersion: 'butler-privacy-v1',
  };
}

export function canRecall(meta: Partial<PrivacyMetadata>, purpose: 'chat' | 'automation' | 'export' | 'ui'): boolean {
  if (meta.retentionUntil && Date.parse(meta.retentionUntil) < Date.now()) return false;
  if (meta.sensitivity === 'secret') return purpose === 'ui';
  if (purpose === 'export') return meta.scope === 'exportable';
  if (purpose === 'automation') return (meta.confidence ?? 0) >= 0.7 && meta.scope !== 'session';
  return true;
}

export function sanitizeCrawlerExcerpt(input: string): { text: string; sensitivity: Sensitivity; blocked: boolean } {
  const sensitivity = classifyText(input);
  if (sensitivity === 'secret') return { text: '', sensitivity, blocked: true };
  return { text: redactSensitiveText(input).slice(0, 12_000), sensitivity, blocked: false };
}

export function shouldRetain(metadata: Partial<PrivacyMetadata>): boolean {
  return !(metadata.retentionUntil && Date.parse(metadata.retentionUntil) < Date.now());
}
