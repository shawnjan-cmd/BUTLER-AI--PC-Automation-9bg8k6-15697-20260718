import * as Crypto from 'expo-crypto';

export type CapabilityIntentEnvelope = {
  version: 1;
  requestId: string;
  capability: string;
  args: Record<string, unknown>;
  scope: string[];
  risk: 'read_only' | 'private_read' | 'external_read' | 'side_effect' | 'remote_side_effect';
  undo: 'none' | 'available' | 'required_when_possible';
  createdAtMs: number;
  expiresAtMs: number;
  previousReceiptHash: string | null;
  payloadDigest: string;
};

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((out, key) => {
      out[key] = normalize((value as Record<string, unknown>)[key]);
      return out;
    }, {});
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export async function createCapabilityIntentEnvelope(input: {
  capability: string;
  args?: Record<string, unknown>;
  scope?: string[];
  risk?: CapabilityIntentEnvelope['risk'];
  undo?: CapabilityIntentEnvelope['undo'];
  previousReceiptHash?: string | null;
  ttlMs?: number;
  nowMs?: number;
}): Promise<CapabilityIntentEnvelope> {
  const nowMs = input.nowMs ?? Date.now();
  const requestId = Crypto.randomUUID();
  const base = {
    version: 1 as const,
    requestId,
    capability: input.capability,
    args: input.args ?? {},
    scope: [...(input.scope ?? [])].sort(),
    risk: input.risk ?? 'read_only',
    undo: input.undo ?? 'none',
    createdAtMs: nowMs,
    expiresAtMs: nowMs + Math.min(Math.max(input.ttlMs ?? 120_000, 5_000), 300_000),
    previousReceiptHash: input.previousReceiptHash ?? null,
  };
  const payloadDigest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    canonicalJson(base),
  );
  return { ...base, payloadDigest };
}

export function isCapabilityIntentUsable(envelope: CapabilityIntentEnvelope, nowMs = Date.now()): boolean {
  return envelope.version === 1
    && Boolean(envelope.requestId)
    && Boolean(envelope.capability)
    && envelope.createdAtMs <= nowMs
    && envelope.expiresAtMs >= nowMs
    && envelope.expiresAtMs > envelope.createdAtMs
    && Boolean(envelope.payloadDigest);
}
