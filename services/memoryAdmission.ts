/**
 * Butler Memory Admission Gate.
 *
 * This module is deliberately deterministic and local. It does not decide that
 * a statement is true; it decides whether a record is eligible for durable
 * memory. The caller remains responsible for user approval and provenance.
 */

export type MemorySensitivity = 'public' | 'personal' | 'sensitive' | 'secret';

export interface MemoryAdmissionInput {
  text: string;
  source: string;
  confidence: number;
  sensitivity?: MemorySensitivity;
  userApproved?: boolean;
  provenanceId?: string;
  durable?: boolean;
}

export interface MemoryAdmissionResult {
  admitted: boolean;
  reason: string;
  normalizedText?: string;
}

const MAX_TEXT = 12_000;
const SECRET_PATTERN = /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|private[_ -]?key|seed phrase|mnemonic|authorization:\s*bearer)\s*[:=]/i;
const DESTRUCTIVE_INSTRUCTION = /(?:delete|wipe|format|disable|bypass|download and run|persist|exfiltrat|ransomware|keylogger)\b.{0,80}(?:file|disk|system|credential|password|device|network|script)/i;

export function admitMemory(input: MemoryAdmissionInput): MemoryAdmissionResult {
  const text = String(input?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  const source = String(input?.source ?? '').trim();
  const confidence = Number(input?.confidence ?? 0);
  const sensitivity = input?.sensitivity ?? 'personal';

  if (!text) return { admitted: false, reason: 'empty' };
  if (!source) return { admitted: false, reason: 'missing_provenance_source' };
  if (!Number.isFinite(confidence) || confidence < 0.25) return { admitted: false, reason: 'confidence_below_threshold' };
  if (SECRET_PATTERN.test(text)) return { admitted: false, reason: 'secret_like_content' };
  if (DESTRUCTIVE_INSTRUCTION.test(text)) return { admitted: false, reason: 'destructive_instruction' };
  if (sensitivity === 'secret') return { admitted: false, reason: 'secret_sensitivity_forbidden' };
  if (input.durable && !input.userApproved && sensitivity !== 'public') {
    return { admitted: false, reason: 'durable_memory_requires_user_approval' };
  }
  if (input.durable && !input.provenanceId) {
    return { admitted: false, reason: 'durable_memory_requires_provenance_id' };
  }
  return { admitted: true, reason: 'admitted', normalizedText: text };
}

export function memoryFingerprint(text: string): string {
  // Stable lightweight fingerprint for deduplication keys. It is not a secret
  // and must not be treated as encryption or authentication.
  let hash = 2166136261;
  for (const char of String(text ?? '').trim().toLowerCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
