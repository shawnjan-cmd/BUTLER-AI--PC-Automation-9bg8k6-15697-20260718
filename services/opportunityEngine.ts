import { serverConnection } from '@/services/serverConnection';
import { autoErrorLogger } from '@/services/autoErrorLogger';

export type OpportunityStatus = 'proposed' | 'accepted' | 'deferred' | 'rejected';

export interface Opportunity {
  id: number;
  fingerprint: string;
  title: string;
  summary: string;
  category: string;
  source_url: string;
  source_title: string;
  evidence: string;
  confidence: number;
  user_value: number;
  implementation_cost: number;
  privacy_risk: number;
  play_risk: number;
  performance_risk: number;
  status: OpportunityStatus;
  created_at: number;
  updated_at: number;
  reviewed_at: number;
  notes: string;
}

export interface OpportunityDraft {
  title: string;
  summary: string;
  category?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  evidence?: string;
  confidence?: number;
  userValue?: number;
  implementationCost?: number;
  privacyRisk?: number;
  playRisk?: number;
  performanceRisk?: number;
}

class OpportunityEngine {
  async list(options: { status?: OpportunityStatus; category?: string; limit?: number } = {}): Promise<Opportunity[]> {
    try {
      const res = await serverConnection.request('/api/improvements/list', {
        method: 'POST',
        body: JSON.stringify({ ...options, limit: Math.min(100, Math.max(1, options.limit ?? 40)) }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.items) ? data.items : [];
    } catch (error: any) {
      autoErrorLogger.logWarning('OpportunityEngine', `list failed: ${error?.message || 'unknown'}`);
      return [];
    }
  }

  async submit(draft: OpportunityDraft): Promise<Opportunity | null> {
    if (draft.title.trim().length < 4 || draft.summary.trim().length < 12) return null;
    try {
      const res = await serverConnection.request('/api/improvements/submit', {
        method: 'POST',
        body: JSON.stringify({ ...draft, autoApply: false }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.proposal ?? null;
    } catch (error: any) {
      autoErrorLogger.logWarning('OpportunityEngine', `submit failed: ${error?.message || 'unknown'}`);
      return null;
    }
  }

  async review(id: number, decision: Exclude<OpportunityStatus, 'proposed'> | 'proposed', notes = ''): Promise<Opportunity | null> {
    if (!Number.isInteger(id) || id <= 0) return null;
    try {
      const res = await serverConnection.request('/api/improvements/review', {
        method: 'POST',
        body: JSON.stringify({ id, decision, notes, autoApply: false }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.proposal ?? null;
    } catch (error: any) {
      autoErrorLogger.logWarning('OpportunityEngine', `review failed: ${error?.message || 'unknown'}`);
      return null;
    }
  }
}

export const opportunityEngine = new OpportunityEngine();
