/**
 * BUTLER IMMUTABLE SAFETY POLICY v1
 *
 * These rules are deliberately conservative. They are enforced at admission
 * and execution boundaries; UI settings cannot disable them.
 */

export const IMMUTABLE_SAFETY_RULES = Object.freeze([
  Object.freeze({
    id: 'MEMORY_NO_PLAINTEXT',
    title: 'MEMORY IS NEVER PERSISTED IN PLAINTEXT',
    text: 'Every admitted memory record is encoded, encrypted, authenticated, and integrity-checked before persistence. There is no plaintext fallback.',
  }),
  Object.freeze({
    id: 'NO_PRIVATE_DATA_EXFILTRATION',
    title: 'PRIVATE DATA NEVER LEAVES THE LOCAL TRUST BOUNDARY',
    text: 'Butler cannot send memory, vault content, credentials, tokens, location, microphone data, or files to a developer cloud or an unapproved destination.',
  }),
  Object.freeze({
    id: 'NO_UNTRUSTED_SIDE_EFFECTS',
    title: 'UNTRUSTED CODE CANNOT EXECUTE OR CHANGE SECURITY STATE',
    text: 'Scripts, downloads, installers, secret-disclosure requests, and security-policy changes require evidence, explicit user intent, and fail-closed checks.',
  }),
] as const);

export type ImmutableRuleId = typeof IMMUTABLE_SAFETY_RULES[number]['id'];

export function immutableRuleIds(): ImmutableRuleId[] {
  return IMMUTABLE_SAFETY_RULES.map(rule => rule.id);
}

export function assertImmutablePolicyIntact(): void {
  if (IMMUTABLE_SAFETY_RULES.length !== 3) throw new Error('IMMUTABLE_POLICY_TAMPERED');
  for (const rule of IMMUTABLE_SAFETY_RULES) {
    if (!rule.id || !rule.title || !rule.text) throw new Error('IMMUTABLE_POLICY_TAMPERED');
  }
}

export function denyUnsafeBoundary(action: string): never {
  throw new Error(`IMMUTABLE_POLICY_BLOCK:${action}`);
}
