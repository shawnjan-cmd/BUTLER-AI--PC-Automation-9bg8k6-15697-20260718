export type FlowStage = 'intent' | 'safety' | 'approval' | 'execution' | 'receipt';
export type FlowOutcome = 'succeeded' | 'failed' | 'cancelled' | 'rejected';

export interface FlowIntent {
  ledgerId: string;
  receiptId: string;
  actorId: string;
  capability: string;
  payloadDigest: string;
  createdAtMs: number;
}

export interface FlowSafety {
  ledgerId: string;
  receiptId: string;
  stage: 'safety';
  decision: 'allow' | 'deny' | 'review';
  policyVersion: string;
  reasons: string[];
  resourceBudget: Record<string, unknown>;
}

export interface FlowApproval {
  ledgerId: string;
  receiptId: string;
  approvalId: string;
  intentDigest: string;
  capability: string;
  expiresAtMs: number;
  singleUse: true;
  approvalToken: string;
}

export interface FlowReceipt {
  ledgerId: string;
  receiptId: string;
  stage: 'receipt';
  outcome: FlowOutcome;
  eventHash: string;
  previousHash: string;
  resourceSummary: Record<string, unknown>;
  deletionStatus: string;
}

export interface FlowLedgerClient {
  beginIntent(input: { capability: string; request: Record<string, unknown> }): Promise<FlowIntent>;
  requestSafety(input: { ledgerId: string }): Promise<FlowSafety>;
  approve(input: { ledgerId: string; intentDigest: string; capability: string }): Promise<FlowApproval>;
  execute(input: { ledgerId: string; approvalToken: string; intentDigest: string; capability: string }): Promise<FlowReceipt>;
}

export function isApprovalUsable(approval: FlowApproval, nowMs = Date.now()): boolean {
  return approval.singleUse === true && approval.expiresAtMs >= nowMs && Boolean(approval.approvalToken);
}

export function canRenderNextStage(current: FlowStage, next: FlowStage): boolean {
  const order: FlowStage[] = ['intent', 'safety', 'approval', 'execution', 'receipt'];
  return order.indexOf(next) === order.indexOf(current) + 1;
}
