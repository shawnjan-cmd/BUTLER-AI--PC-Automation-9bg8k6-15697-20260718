import { performanceGovernor, OptionalWorkKind } from './performanceGovernor';

export type FailureKind =
  | 'js_stall'
  | 'network_timeout'
  | 'network_unavailable'
  | 'stale_cache'
  | 'queue_starvation'
  | 'ollama_unavailable'
  | 'crawler_backoff'
  | 'storage_error'
  | 'server_unreachable'
  | 'unknown';

export type RepairKind =
  | 'clear_optional_queue'
  | 'retry_with_backoff'
  | 'invalidate_cache_key'
  | 'pause_optional_work'
  | 'reconnect_read_only'
  | 'request_user_review';

export interface HealingEvent {
  id: string;
  kind: FailureKind;
  repair: RepairKind;
  severity: 'info' | 'warning' | 'critical';
  at: number;
  receipt: string;
  applied: boolean;
}

export interface HealingSnapshot {
  healthy: boolean;
  lastFailure: FailureKind | null;
  lastRepair: RepairKind | null;
  events: HealingEvent[];
  consecutiveFailures: number;
  nextRetryAt: number;
}

type Listener = (snapshot: HealingSnapshot) => void;

const MAX_EVENTS = 40;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1_500;

class SelfHealingSupervisor {
  private started = false;
  private listeners = new Set<Listener>();
  private events: HealingEvent[] = [];
  private consecutiveFailures = 0;
  private nextRetryAt = 0;

  start(): void { this.started = true; }
  stop(): void { this.started = false; }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    try { listener(this.snapshot()); } catch {}
    return () => this.listeners.delete(listener);
  }

  snapshot(): HealingSnapshot {
    const last = this.events[this.events.length - 1];
    return {
      healthy: this.consecutiveFailures === 0,
      lastFailure: last?.kind ?? null,
      lastRepair: last?.repair ?? null,
      events: this.events.slice(-MAX_EVENTS),
      consecutiveFailures: this.consecutiveFailures,
      nextRetryAt: this.nextRetryAt,
    };
  }

  async runCritical<T>(label: string, work: () => Promise<T>): Promise<T> {
    // The supervisor never retries or cancels critical work implicitly.
    return performanceGovernor.runCritical(label, work);
  }

  async runOptional<T>(kind: OptionalWorkKind, work: () => Promise<T>): Promise<T | undefined> {
    return performanceGovernor.runOptional(kind, work);
  }

  report(kind: FailureKind, context = ''): HealingEvent {
    this.consecutiveFailures += 1;
    const repair = this.chooseRepair(kind);
    const severity = this.severityFor(kind);
    const applied = this.applyRepair(repair);
    const receipt = this.receipt(kind, repair, context);
    const event: HealingEvent = { id: `heal_${Date.now()}_${this.events.length}`, kind, repair, severity, at: Date.now(), receipt, applied };
    this.events = [...this.events, event].slice(-MAX_EVENTS);
    this.notify();
    return event;
  }

  markRecovered(): void {
    this.consecutiveFailures = 0;
    this.nextRetryAt = 0;
    this.notify();
  }

  canRetry(): boolean { return Date.now() >= this.nextRetryAt && this.consecutiveFailures < MAX_RETRIES; }

  private chooseRepair(kind: FailureKind): RepairKind {
    if (kind === 'js_stall' || kind === 'queue_starvation' || kind === 'crawler_backoff') return 'pause_optional_work';
    if (kind === 'stale_cache') return 'invalidate_cache_key';
    if (kind === 'network_timeout' || kind === 'network_unavailable' || kind === 'server_unreachable') return 'retry_with_backoff';
    if (kind === 'storage_error' || kind === 'ollama_unavailable') return 'reconnect_read_only';
    return 'request_user_review';
  }

  private severityFor(kind: FailureKind): HealingEvent['severity'] {
    if (kind === 'storage_error' || kind === 'unknown') return 'critical';
    if (kind === 'js_stall' || kind === 'ollama_unavailable') return 'warning';
    return 'info';
  }

  private applyRepair(repair: RepairKind): boolean {
    if (!this.started && repair !== 'request_user_review') return false;
    switch (repair) {
      case 'pause_optional_work':
        performanceGovernor.stop();
        // Critical work is not disabled; optional work will be restarted by the caller.
        return true;
      case 'retry_with_backoff':
        this.nextRetryAt = Date.now() + BASE_BACKOFF_MS * Math.max(1, this.consecutiveFailures);
        return true;
      case 'invalidate_cache_key':
      case 'reconnect_read_only':
      case 'request_user_review':
      case 'clear_optional_queue':
        // These require a caller-specific adapter and are intentionally fail-closed.
        return false;
      default:
        return false;
    }
  }

  private receipt(kind: FailureKind, repair: RepairKind, context: string): string {
    const safeContext = String(context).replace(/[\r\n\t]/g, ' ').slice(0, 120);
    return `${Date.now()}|${kind}|${repair}|${safeContext}`;
  }

  private notify(): void { this.listeners.forEach(listener => { try { listener(this.snapshot()); } catch {} }); }
}

export const selfHealingSupervisor = new SelfHealingSupervisor();
