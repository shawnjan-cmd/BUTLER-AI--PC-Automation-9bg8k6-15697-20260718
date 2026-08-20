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
