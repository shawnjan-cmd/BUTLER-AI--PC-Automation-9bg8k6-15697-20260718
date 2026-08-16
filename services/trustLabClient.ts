import { connectionHub } from '@/services/connectionHub';

export type TrustFinding = {
  rule_id: string;
  severity: 'block' | 'review';
  message: string;
  line: number | null;
  evidence: string;
};

export type TrustReport = {
  script_id: string;
  digest: string;
  status: 'verified' | 'review' | 'blocked';
  verified: boolean;
  origin: string;
  findings: TrustFinding[];
  immutable_rules: string[];
};

export async function scanScriptTrust(scriptId: string, source: string, origin = 'bundled-library'): Promise<TrustReport> {
  const response = await connectionHub.fetch('/api/trust/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptId, source, origin, allowNetwork: false }),
    timeoutMs: 10000,
  });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.report) throw new Error(payload?.code || payload?.error || `Trust Lab HTTP ${response.status}`);
  return { ...payload.report, immutable_rules: Array.isArray(payload.immutableRules) ? payload.immutableRules : [] } as TrustReport;
}
