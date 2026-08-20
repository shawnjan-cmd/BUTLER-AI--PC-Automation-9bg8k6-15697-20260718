/**
 * Butler AI — Automation Request Service
 *
 * The only client bridge for consent-first automation planning. It never runs
 * code directly and never retains approval tokens. Each consequential step is
 * delegated to the paired server through the Flow Ledger sequence.
 */

import { serverConnection } from './serverConnection';
import type { AutomationPlan } from './automationCommandContract';

export interface DraftSaveResult {
  status: string;
  scriptId?: string;
  scriptDigest?: string;
  safety?: { allowed?: boolean; warnings?: string[]; reasons?: string[] };
  error?: string;
}

export interface FlowIntentResult {
  status: string;
  intent?: { ledgerId: string; intentDigest: string; scriptId: string; scriptDigest: string };
  dryRun?: { status?: string; output?: string; error?: string };
  safety?: { allowed?: boolean; warnings?: string[]; reasons?: string[] };
  error?: string;
}

export interface FlowApprovalResult {
  status: string;
  approvalToken?: string;
  expiresAtMs?: number;
  error?: string;
}

export interface FlowExecutionResult {
  success: boolean;
  status: string;
  output?: string;
  error?: string;
  receipt?: unknown;
  undoId?: string | null;
}

async function post<T>(path: string, body: unknown, timeoutMs = 20_000): Promise<T> {
  if (!serverConnection.isConnected()) {
    throw new Error('No server connected. Pair your PC before starting an automation workflow.');
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await serverConnection.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(String(data?.error || data?.reason || data?.message || `Server rejected ${path} (${res.status})`));
    }
    return data as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error(`Automation request timed out after ${Math.round(timeoutMs / 1000)} seconds`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestServerAutomationPlan(request: string): Promise<AutomationPlan> {
  const data = await post<{ status: string; plan?: AutomationPlan; reason?: string }>('/api/automation/plan', { request });
  if (data.status !== 'ready' || !data.plan) throw new Error(data.reason || 'Server could not create an automation plan');
  return data.plan;
}

export async function saveAutomationDraft(input: { scriptName: string; code: string; planId?: string }): Promise<DraftSaveResult> {
  return post<DraftSaveResult>('/api/flow/script/draft', {
    script_name: input.scriptName,
    code: input.code,
    plan_id: input.planId,
  }, 30_000);
}

export async function beginAutomationIntent(scriptId: string, envelope: Record<string, unknown>): Promise<FlowIntentResult> {
  return post<FlowIntentResult>('/api/flow/script/intent', { id: scriptId, envelope }, 30_000);
}

/** Call only from a clearly labelled user-initiated approval control. */
export async function approveAutomationIntent(ledgerId: string, intentDigest: string): Promise<FlowApprovalResult> {
  return post<FlowApprovalResult>('/api/flow/script/approve', { ledgerId, intentDigest }, 15_000);
}

/** Call only after the user has explicitly approved the exact preflighted draft. */
export async function executeApprovedAutomation(approvalToken: string): Promise<FlowExecutionResult> {
  return post<FlowExecutionResult>('/api/flow/script/execute', { approvalToken }, 45_000);
}

export const automationRequestService = {
  requestServerAutomationPlan,
  saveAutomationDraft,
  beginAutomationIntent,
  approveAutomationIntent,
  executeApprovedAutomation,
};
