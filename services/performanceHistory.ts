/**
 * Butler AI — Performance History Service
 * Maintains a rolling 60-point circular buffer (1 reading per minute)
 * of CPU, RAM, and disk metrics fetched from the connected PC.
 *
 * Used by SparklineWidget to render mini trend charts.
 * Persists to AsyncStorage so chart has history after app restart.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY    = '@butler_perf_history_v1';
const MAX_POINTS     = 60;
const SAMPLE_INTERVAL_MS = 60_000; // 1 reading per minute

export interface PerfReading {
  ts:   number;   // epoch ms
  cpu:  number;   // 0–100
  ram:  number;   // 0–100
  disk: number;   // 0–100
}

type Listener = (history: PerfReading[]) => void;

class PerformanceHistoryService {
  private static _instance: PerformanceHistoryService;
  static getInstance() {
    if (!this._instance) this._instance = new PerformanceHistoryService();
    return this._instance;
  }

  private _history: PerfReading[]    = [];
  private _listeners: Set<Listener>  = new Set();
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _loaded = false;

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    if (this._loaded) fn([...this._history]);
    return () => this._listeners.delete(fn);
  }

  private _emit() {
    this._listeners.forEach(fn => { try { fn([...this._history]); } catch {} });
  }

  // ── Load persisted history ─────────────────────────────────────
  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PerfReading[];
        this._history = Array.isArray(parsed) ? parsed.slice(-MAX_POINTS) : [];
      }
    } catch {}
    this._loaded = true;
    this._emit();
  }

  private async _save(): Promise<void> {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(this._history));
    } catch {}
  }

  // ── Push a new reading ─────────────────────────────────────────
  addReading(cpu: number, ram: number, disk: number): void {
    const reading: PerfReading = {
      ts:   Date.now(),
      cpu:  Math.min(100, Math.max(0, Math.round(cpu))),
      ram:  Math.min(100, Math.max(0, Math.round(ram))),
      disk: Math.min(100, Math.max(0, Math.round(disk))),
    };
    this._history.push(reading);
    if (this._history.length > MAX_POINTS) {
      this._history = this._history.slice(-MAX_POINTS);
    }
    this._emit();
    this._save();
  }

  getHistory(): PerfReading[] { return [...this._history]; }

  // Last N readings
  getRecent(n: number): PerfReading[] {
    return this._history.slice(-Math.min(n, this._history.length));
  }

  // Average over last N readings
  getAverage(field: keyof Omit<PerfReading, 'ts'>, n = 10): number {
    const recent = this.getRecent(n);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((s, r) => s + r[field], 0) / recent.length);
  }

  // Peak over last N readings
  getPeak(field: keyof Omit<PerfReading, 'ts'>, n = 30): number {
    const recent = this.getRecent(n);
    if (recent.length === 0) return 0;
    return Math.max(...recent.map(r => r[field]));
  }

  // Trend: +N% means rising, -N% means falling vs 5-reading average
  getTrend(field: keyof Omit<PerfReading, 'ts'>): number {
    const all = this.getRecent(10);
    if (all.length < 2) return 0;
    const first = all.slice(0, Math.floor(all.length / 2));
    const last  = all.slice(Math.floor(all.length / 2));
    const avgFirst = first.reduce((s, r) => s + r[field], 0) / first.length;
    const avgLast  = last.reduce((s,  r) => s + r[field], 0) / last.length;
    return Math.round(avgLast - avgFirst);
  }

  // ── Auto-sample from connected server every minute ─────────────
  startAutoSampling(): void {
    if (this._timer) return;
    this._timer = setInterval(() => this._sample(), SAMPLE_INTERVAL_MS);
  }

  stopAutoSampling(): void {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  private async _sample(): Promise<void> {
    try {
      const { serverConnection } = await import('./serverConnection');
      if (!serverConnection.isConnected?.()) return;
      const ip    = serverConnection.getIP?.() ?? '';
      const port  = serverConnection.getPort?.() ?? '';
      if (!ip || !port) return;
      // Use buildHeaders() so X-Device-Id + X-Butler-App-Sig are included
      // and all auth header logic is centralised in serverConnection.
      const h = serverConnection.buildHeaders({ 'Cache-Control': 'no-cache' });
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`http://${ip}:${port}/api/metrics`, { headers: h, signal: ctrl.signal });
      if (!res.ok) return;
      const d = await res.json();
      const cpu  = d.cpu_percent  ?? d.cpu?.percent  ?? 0;
      const ram  = d.ram_percent  ?? d.memory?.percent ?? 0;
      const disk = d.disk_percent ?? d.disk?.percent  ?? 0;
      this.addReading(cpu, ram, disk);
    } catch {}
  }

  // Allow external callers to push a reading (e.g. from nexushome poll)
  recordFromMetrics(d: { cpu_percent?: number; ram_percent?: number; disk_percent?: number; cpu?: any; memory?: any; disk?: any }): void {
    const cpu  = d.cpu_percent  ?? d.cpu?.percent  ?? 0;
    const ram  = d.ram_percent  ?? d.memory?.percent ?? 0;
    const disk = d.disk_percent ?? d.disk?.percent  ?? 0;
    // Debounce: only add if last reading is > 30s old
    const last = this._history[this._history.length - 1];
    if (!last || Date.now() - last.ts > 30_000) {
      this.addReading(cpu, ram, disk);
    }
  }
}

export const performanceHistory = PerformanceHistoryService.getInstance();
