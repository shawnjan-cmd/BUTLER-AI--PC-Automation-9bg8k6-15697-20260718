/**
 * Butler Frame Budget Monitor.
 *
 * Uses requestAnimationFrame only while the app is active. It aggregates
 * samples instead of persisting every frame, keeps callbacks tiny, and reports
 * truthful local UI timing to the existing performance governor. It does not
 * upload telemetry or disable critical interactions.
 */
import { performanceGovernor } from './performanceGovernor';

export interface FrameBudgetSnapshot {
  sampledFrames: number;
  jankyFrames: number;
  frozenFrames: number;
  lastFrameMs: number;
  p95FrameMs: number;
  windowStartedAt: number;
  active: boolean;
}

type Listener = (snapshot: FrameBudgetSnapshot) => void;

const TARGET_FRAME_MS = 16.67;
const FROZEN_FRAME_MS = 700;
const WINDOW_MS = 5000;
const MAX_SAMPLES = 180;

class FrameBudgetMonitor {
  private _active = false;
  private _raf: number | null = null;
  private _lastFrameAt = 0;
  private _windowStartedAt = 0;
  private _samples: number[] = [];
  private _jankyFrames = 0;
  private _frozenFrames = 0;
  private _lastFrameMs = 0;
  private _listeners = new Set<Listener>();

  start(): void {
    if (this._active || typeof requestAnimationFrame !== 'function') return;
    this._active = true;
    this._windowStartedAt = Date.now();
    this._lastFrameAt = 0;
    this._schedule();
  }

  stop(): void {
    this._active = false;
    if (this._raf !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._raf);
    this._raf = null;
    this._notify();
  }

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    try { listener(this.snapshot()); } catch {}
    return () => this._listeners.delete(listener);
  }

  snapshot(): FrameBudgetSnapshot {
    return {
      sampledFrames: this._samples.length,
      jankyFrames: this._jankyFrames,
      frozenFrames: this._frozenFrames,
      lastFrameMs: this._lastFrameMs,
      p95FrameMs: this._percentile(0.95),
      windowStartedAt: this._windowStartedAt,
      active: this._active,
    };
  }

  resetWindow(): void {
    this._samples = [];
    this._jankyFrames = 0;
    this._frozenFrames = 0;
    this._lastFrameMs = 0;
    this._windowStartedAt = Date.now();
    this._notify();
  }

  private _schedule(): void {
    if (!this._active || typeof requestAnimationFrame !== 'function') return;
    this._raf = requestAnimationFrame((timestamp) => {
      if (!this._active) return;
      const now = Number.isFinite(timestamp) ? timestamp : Date.now();
      if (this._lastFrameAt > 0) {
        const duration = Math.max(0, now - this._lastFrameAt);
        this._record(duration);
      }
      this._lastFrameAt = now;
      if (Date.now() - this._windowStartedAt >= WINDOW_MS) {
        this._applyBudgetSignal();
        this._windowStartedAt = Date.now();
        this._samples = [];
        this._jankyFrames = 0;
        this._frozenFrames = 0;
      }
      this._schedule();
    });
  }

  private _record(duration: number): void {
    this._lastFrameMs = Math.round(duration * 100) / 100;
    this._samples.push(this._lastFrameMs);
    if (this._samples.length > MAX_SAMPLES) this._samples.shift();
    if (duration > TARGET_FRAME_MS) this._jankyFrames += 1;
    if (duration >= FROZEN_FRAME_MS) this._frozenFrames += 1;
  }

  private _applyBudgetSignal(): void {
    const snapshot = this.snapshot();
    const jankRate = snapshot.sampledFrames ? snapshot.jankyFrames / snapshot.sampledFrames : 0;
    if (snapshot.frozenFrames > 0 || jankRate >= 0.25 || snapshot.p95FrameMs >= 32) {
      // Use the existing optional-work circuit; critical work is never paused.
      performanceGovernor.pauseOptionalFor?.('frame_budget_pressure');
    }
  }

  private _percentile(p: number): number {
    if (this._samples.length === 0) return 0;
    const sorted = [...this._samples].sort((a, b) => a - b);
    return Math.round(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] * 100) / 100;
  }

  private _notify(): void {
    const snapshot = this.snapshot();
    this._listeners.forEach(listener => { try { listener(snapshot); } catch {} });
  }
}

export const frameBudgetMonitor = new FrameBudgetMonitor();
