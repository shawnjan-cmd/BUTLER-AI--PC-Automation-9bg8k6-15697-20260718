/**
 * Butler AI — Automation Workflow Monitor
 *
 * A correlation-safe state machine for the Android ↔ paired-PC automation path.
 * It records only compact, non-secret event metadata and rejects impossible
 * stage jumps so UI cannot drift into a false "completed" state.
 */

import { encryptedStorage } from './encryptedStorage';
import { aiLogger } from './aiLogger';

export type WorkflowStage =
  | 'android_intent'
  | 'pattern_match'
  | 'pc_preflight'
  | 'memory_manifest'
  | 'draft_ready'
  | 'script_library_handoff'
  | 'dry_run'
  | 'approval_required'
  | 'receipt';

export type WorkflowEventState = 'active' | 'completed' | 'blocked' | 'failed';

export interface WorkflowEvent {
  correlationId: string;
  sequence: number;
  stage: WorkflowStage;
  state: WorkflowEventState;
  source: 'android' | 'paired_pc';
  timestamp: number;
  detail: string;
  receiptId?: string;
}

export interface WorkflowSnapshot {
  correlationId: string;
  stage: WorkflowStage;
  state: WorkflowEventState;
  events: WorkflowEvent[];
  updatedAt: number;
}

const KEY_PREFIX = '@butler_workflow_trace_';
const MAX_EVENTS = 32;
const ORDER: WorkflowStage[] = [
  'android_intent', 'pattern_match', 'pc_preflight', 'memory_manifest',
  'draft_ready', 'script_library_handoff', 'dry_run', 'approval_required', 'receipt',
];

function safeDetail(value: string): string {
  return String(value || '')
    .replace(/(?:token|password|secret|authorization|api[_ -]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=<redacted>')
    .replace(/https?:\/\/[^\s,;]+/gi, '<trusted-route>')
    .replace(/(?:[A-Za-z]:\\|\/home\/|\/Users\/)[^\s,;]+/g, '<local-path>')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '<local-address>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

function createCorrelationId(): string {
  return `flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

class AutomationWorkflowMonitor {
  private snapshots = new Map<string, WorkflowSnapshot>();

  async begin(detail: string): Promise<WorkflowSnapshot> {
    const correlationId = createCorrelationId();
    const event: WorkflowEvent = {
      correlationId, sequence: 1, stage: 'android_intent', state: 'active', source: 'android', timestamp: Date.now(), detail: safeDetail(detail),
    };
    const snapshot: WorkflowSnapshot = { correlationId, stage: event.stage, state: event.state, events: [event], updatedAt: event.timestamp };
    this.snapshots.set(correlationId, snapshot);
    await this.persist(snapshot);
    aiLogger.workflow({ correlationId, stage: event.stage, state: event.state, source: event.source, detail: event.detail });
    return this.clone(snapshot);
  }

  async advance(correlationId: string, stage: WorkflowStage, detail: string, source: WorkflowEvent['source'], state: WorkflowEventState = 'active', receiptId?: string): Promise<WorkflowSnapshot> {
    const snapshot = this.snapshots.get(correlationId);
    if (!snapshot) throw new Error('Workflow correlation is unknown; begin a new plan instead of guessing state.');
    if (snapshot.state === 'blocked' || snapshot.state === 'failed' || snapshot.stage === 'receipt') {
      throw new Error('Workflow is terminal and cannot advance without a new correlation ID.');
    }
    const currentIndex = ORDER.indexOf(snapshot.stage);
    const nextIndex = ORDER.indexOf(stage);
    if (nextIndex < 0 || nextIndex > currentIndex + 1) {
      throw new Error(`Rejected out-of-order workflow transition: ${snapshot.stage} → ${stage}`);
    }
    if (nextIndex < currentIndex) {
      throw new Error(`Rejected workflow regression: ${snapshot.stage} → ${stage}`);
    }
    const event: WorkflowEvent = {
      correlationId,
      sequence: snapshot.events.length + 1,
      stage,
      state,
      source,
      timestamp: Date.now(),
      detail: safeDetail(detail),
      receiptId: receiptId?.slice(0, 96),
    };
    snapshot.events = [...snapshot.events, event].slice(-MAX_EVENTS);
    snapshot.stage = stage;
    snapshot.state = state;
    snapshot.updatedAt = event.timestamp;
    this.snapshots.set(correlationId, snapshot);
    await this.persist(snapshot);
    aiLogger.workflow({ correlationId, stage, state, source, detail: event.detail });
    return this.clone(snapshot);
  }

  async fail(correlationId: string, detail: string, blocked = false): Promise<WorkflowSnapshot> {
    const snapshot = this.snapshots.get(correlationId);
    if (!snapshot) throw new Error('Workflow correlation is unknown');
    const event: WorkflowEvent = {
      correlationId,
      sequence: snapshot.events.length + 1,
      stage: snapshot.stage,
      state: blocked ? 'blocked' : 'failed',
      source: 'android',
      timestamp: Date.now(),
      detail: safeDetail(detail),
    };
    snapshot.events = [...snapshot.events, event].slice(-MAX_EVENTS);
    snapshot.state = event.state;
    snapshot.updatedAt = event.timestamp;
    this.snapshots.set(correlationId, snapshot);
    await this.persist(snapshot);
    aiLogger.workflow({ correlationId, stage: event.stage, state: event.state, source: event.source, detail: event.detail });
    return this.clone(snapshot);
  }

  get(correlationId: string): WorkflowSnapshot | null {
    const snapshot = this.snapshots.get(correlationId);
    return snapshot ? this.clone(snapshot) : null;
  }

  private async persist(snapshot: WorkflowSnapshot): Promise<void> {
    try {
      await encryptedStorage.setItem(`${KEY_PREFIX}${snapshot.correlationId}`, JSON.stringify(snapshot));
    } catch {
      // Telemetry is non-authoritative. Failure to persist it may never change
      // an execution decision or fabricate a success state.
    }
  }

  private clone(snapshot: WorkflowSnapshot): WorkflowSnapshot {
    return JSON.parse(JSON.stringify(snapshot));
  }
}

export const automationWorkflowMonitor = new AutomationWorkflowMonitor();
