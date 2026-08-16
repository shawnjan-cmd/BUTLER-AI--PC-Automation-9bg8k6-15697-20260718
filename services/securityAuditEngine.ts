export type VulnSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityFinding {
  id: string;
  title: string;
  severity: VulnSeverity;
  status?: 'open' | 'accepted' | 'fixed';
  description?: string;
}

export interface AuditReport {
  findings: SecurityFinding[];
  generatedAt: number;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

type Subscriber = (report: AuditReport) => void;

class SecurityAuditEngine {
  subscribe(listener: Subscriber) {
    listener({ findings: [], generatedAt: Date.now(), score: 100, critical: 0, high: 0, medium: 0, low: 0 });
    return () => {};
  }

  async attemptFix(_id: string) {}
  acceptRisk(_id: string) {}
  async runAudit() {
    return { findings: [], generatedAt: Date.now(), score: 100, critical: 0, high: 0, medium: 0, low: 0 } satisfies AuditReport;
  }
}

export const securityAuditEngine = new SecurityAuditEngine();
