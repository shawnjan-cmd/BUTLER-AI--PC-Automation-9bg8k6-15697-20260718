/**
 * Butler AI — Critical Path Performance Governor
 *
 * Permanent rules:
 * 1. Critical operations are never rejected, delayed, or disabled by this module.
 *    AI chat, Ollama requests, pairing, authentication, script launch, file transfer,
 *    and explicit user actions always remain available to their own timeouts/policies.
 * 2. Only optional work may be paused: crawler/indexing, background telemetry-like
 *    diagnostics, decorative effects, speculative prefetch, and status polling.
 * 3. Optional work is isolated with a bounded queue, a circuit breaker, and debounce.
 *    A failure in optional work cannot reject or cancel a critical operation.
 * 4. Startup is staged. The first render and critical services are not awaited on
 *    optional imports, animations, crawlers, metrics, or update checks.
 * 5. Every decision is observable through a redacted in-memory snapshot; no user
 *    content, tokens, addresses, or private memory is logged.
 */

export type PerformancePriority = 'critical' | 'optional';
export type OptionalWorkKind =
  | 'crawler'
  | 'indexing'
  | 'status-poll'
  | 'prefetch'
  | 'diagnostic'
  | 'decorative'
  | 'update-check';

export interface PerformanceSnapshot {
  mode: 'normal' | 'constrained' | 'recovering';
  optionalPaused: boolean;
  optionalPausedUntil: number;
  activeCritical: number;
  queuedOptional: number;
  consecutiveOptionalFailures: number;
  lastStallMs: number;
  lastAlertAt: number;
}

type Listener = (snapshot: PerformanceSnapshot) => void;

const OPTIONAL_FAILURE_LIMIT = 3;
const OPTIONAL_PAUSE_MS = 30_000;
const ALERT_DEBOUNCE_MS = 20_000;
const STALL_THRESHOLD_MS = 350;
const STALL_SAMPLE_MS = 1_000;
const MAX_OPTIONAL_QUEUE = 24;

class PerformanceGovernor {
  private _listeners = new Set<Listener>();
  private _started = false;
  private _mode: PerformanceSnapshot['mode'] = 'normal';
  private _optionalPausedUntil = 0;
  private _activeCritical = 0;
  private _queuedOptional = 0;
  private _consecutiveOptionalFailures = 0;
  private _lastStallMs = 0;
  private _lastAlertAt = 0;
  private _stallTimer: ReturnType<typeof setTimeout> | null = null;
  private _queue: Array<() => Promise<void> | void> = [];
  private _draining = false;

  start(): void {
    if (this._started) return;
    this._started = true;
    this._scheduleStallSample();
  }

  stop(): void {
    this._started = false;
    if (this._stallTimer) clearTimeout(this._stallTimer);
    this._stallTimer = null;
    this._queue.length = 0;
    this._queuedOptional = 0;
    this._notify();
  }

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    try { listener(this.snapshot()); } catch {}
    return () => this._listeners.delete(listener);
  }

  snapshot(): PerformanceSnapshot {
    const now = Date.now();
    const paused = this._optionalPausedUntil > now;
    if (!paused && this._mode === 'constrained' && this._consecutiveOptionalFailures === 0) {
      this._mode = 'recovering';
    }
    return {
      mode: this._mode,
      optionalPaused: paused,
      optionalPausedUntil: this._optionalPausedUntil,
      activeCritical: this._activeCritical,
      queuedOptional: this._queuedOptional,
      consecutiveOptionalFailures: this._consecutiveOptionalFailures,
      lastStallMs: this._lastStallMs,
      lastAlertAt: this._lastAlertAt,
    };
  }

  /** Critical operations bypass optional-work pressure by design. */
  async runCritical<T>(label: string, work: () => Promise<T>): Promise<T> {
    this._activeCritical += 1;
    this._notify();
    try {
      return await work();
    } finally {
      this._activeCritical = Math.max(0, this._activeCritical - 1);
      this._notify();
    }
  }

  /** Optional work may pause; it never shares cancellation with critical work. */
  async runOptional<T>(kind: OptionalWorkKind, work: () => Promise<T>): Promise<T | undefined> {
    if (!this.canRunOptional(kind)) return undefined;
    try {
      const result = await work();
      this._consecutiveOptionalFailures = 0;
      if (this._mode === 'recovering') this._mode = 'normal';
      this._notify();
      return result;
    } catch (error) {
      this._consecutiveOptionalFailures += 1;
      if (this._consecutiveOptionalFailures >= OPTIONAL_FAILURE_LIMIT) {
        this._optionalPausedUntil = Date.now() + OPTIONAL_PAUSE_MS;
        this._mode = 'constrained';
      }
      this._notify();
      // Optional work is intentionally swallowed. Callers must keep their own
      // diagnostics, but an optional failure must never affect core features.
      return undefined;
    }
  }

  canRunOptional(_kind: OptionalWorkKind): boolean {
    return this._optionalPausedUntil <= Date.now() && this._activeCritical < 8;
  }

  /** Pause only optional work after a measured local pressure signal. */
  pauseOptionalFor(reason: string, durationMs = OPTIONAL_PAUSE_MS): void {
    this._optionalPausedUntil = Math.max(this._optionalPausedUntil, Date.now() + Math.max(1000, durationMs));
    this._mode = 'constrained';
    this._notify();
  }

  /** Schedule non-critical work after a small idle delay; never blocks startup. */
  scheduleOptional(kind: OptionalWorkKind, work: () => Promise<void> | void, delayMs = 0): boolean {
    if (!this.canRunOptional(kind) || this._queue.length >= MAX_OPTIONAL_QUEUE) return false;
    this._queue.push(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, Math.max(0, delayMs)));
      await this.runOptional(kind, async () => { await work(); });
    });
    this._queuedOptional = this._queue.length;
    this._notify();
    void this._drainOptionalQueue();
    return true;
  }

  /** Use for user-visible warnings; repeated pressure is coalesced. */
  shouldAlert(): boolean {
    const now = Date.now();
    if (now - this._lastAlertAt < ALERT_DEBOUNCE_MS) return false;
    this._lastAlertAt = now;
    this._notify();
    return true;
  }

  private async _drainOptionalQueue(): Promise<void> {
    if (this._draining) return;
    this._draining = true;
    try {
      while (this._queue.length > 0 && this.canRunOptional('diagnostic')) {
        const job = this._queue.shift();
        this._queuedOptional = this._queue.length;
        if (job) await job();
        // Yield between optional tasks so chat and gestures get the JS turn.
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
    } finally {
      this._draining = false;
      this._notify();
    }
  }

  private _scheduleStallSample(): void {
    if (!this._started) return;
    const started = Date.now();
    this._stallTimer = setTimeout(() => {
      const drift = Math.max(0, Date.now() - started - STALL_SAMPLE_MS);
      this._lastStallMs = drift;
      if (drift >= STALL_THRESHOLD_MS) {
        this._mode = 'constrained';
        this._optionalPausedUntil = Math.max(this._optionalPausedUntil, Date.now() + OPTIONAL_PAUSE_MS);
      } else if (this._mode === 'constrained' && this._optionalPausedUntil <= Date.now()) {
        this._mode = 'recovering';
      }
      this._notify();
      this._scheduleStallSample();
    }, STALL_SAMPLE_MS);
  }

  private _notify(): void {
    const snapshot = this.snapshot();
    this._listeners.forEach(listener => { try { listener(snapshot); } catch {} });
  }
}

export const performanceGovernor = new PerformanceGovernor();
