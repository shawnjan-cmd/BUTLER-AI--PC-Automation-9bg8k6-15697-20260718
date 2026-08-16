export type ProofState = 'fresh' | 'stale' | 'clock_uncertain' | 'unverified';

export interface StatusProof<T> {
  value: T | null;
  source: string;
  collectedAtMs: number;
  expiresAtMs: number;
  receiptId?: string;
  receiptDigest?: string;
  state: ProofState;
  realData: true;
}

export interface VisibleStatus<T> extends StatusProof<T> {
  label: string;
  actionable: boolean;
}

export function statusProof<T>(input: Omit<StatusProof<T>, 'state' | 'realData'>, nowMs: number): StatusProof<T> {
  const state: ProofState = nowMs < input.collectedAtMs
    ? 'clock_uncertain'
    : nowMs >= input.expiresAtMs
      ? 'stale'
      : 'fresh';
  return { ...input, value: state === 'fresh' ? input.value : null, state, realData: true };
}

export function visibleStatus<T>(label: string, input: Omit<StatusProof<T>, 'state' | 'realData'>, nowMs: number): VisibleStatus<T> {
  const proof = statusProof(input, nowMs);
  return { ...proof, label, actionable: proof.state !== 'fresh' };
}

export function canRenderAsLive<T>(proof: StatusProof<T>): boolean {
  return proof.realData && proof.state === 'fresh' && Boolean(proof.source);
}
