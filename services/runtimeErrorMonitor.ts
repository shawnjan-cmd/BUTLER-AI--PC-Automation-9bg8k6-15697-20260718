/**
 * RuntimeErrorMonitor — Universal runtime error capture & auto-fix engine
 * ─────────────────────────────────────────────────────────────────────────
 * Installs 6 global interceptors on boot:
 *   1. ErrorUtils global JS error handler
 *   2. Unhandled promise rejection handler
 *   3. fetch() monkey-patch — captures every failed network request
 *   4. console.error/warn — captures all console errors silently
 *   5. Periodic health checks (server, AsyncStorage, services) every 30s
 *   6. Component error boundary sink
 *
 * Auto-fix engine: pattern → fix → result, all logged.
 * Never throws, never blocks rendering, never crashes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_ENTRIES = 150;
const STORAGE_KEY = '@butler_runtime_monitor_v1';
const HEALTH_INTERVAL_MS = 30_000;

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';
export type ErrorCategory =
  | 'js_crash'
  | 'unhandled_promise'
  | 'network'
  | 'console_error'
  | 'console_warn'
  | 'health_check'
  | 'component_crash'
  | 'storage'
  | 'service'
  | 'auto_fix';

export interface RuntimeError {
  id:           string;
  ts:           number;
  severity:     ErrorSeverity;
  category:     ErrorCategory;
  message:      string;
  source:       string;
  stack?:       string;
  url?:         string;         // for network errors
  statusCode?:  number;         // for network errors
  autoFixed:    boolean;
  fixAttempted: boolean;
  fixResult?:   string;
  count:        number;         // dedupe counter
}

export interface HealthSnapshot {
  ts:            number;
  server:        'ok' | 'degraded' | 'offline';
  serverLatency: number;
  storage:       'ok' | 'warn' | 'error';
  storageUsedKB: number;
  services: {
    serverConnection: boolean;
    autoErrorLogger:  boolean;
    knowledgeAccumulator: boolean;
    executionHistory: boolean;
  };
  errorCount:   number;
  criticalCount: number;
}

type Listener = (errors: RuntimeError[], health: HealthSnapshot | null) => void;

// ── Auto-fix pattern ──────────────────────────────────────────────
interface FixPattern {
  match:    (e: RuntimeError) => boolean;
  label:    string;
  fix:      (e: RuntimeError) => Promise<string>;
}

class RuntimeErrorMonitorService {
  private static _inst: RuntimeErrorMonitorService;
  static getInstance() {
    if (!this._inst) this._inst = new RuntimeErrorMonitorService();
    return this._inst;
  }

  private _errors:    RuntimeError[]  = [];
  private _health:    HealthSnapshot | null = null;
  private _listeners: Set<Listener>   = new Set();
  private _started:   boolean         = false;
  private _timer:     ReturnType<typeof setInterval> | null = null;
  private _origFetch: typeof fetch | null = null;
  private _origConsoleError: typeof console.error | null = null;
  private _origConsoleWarn:  typeof console.warn  | null = null;

  // ── Public API ───────────────────────────────────────────────────
  getErrors()  { return [...this._errors].reverse(); }
  getHealth()  { return this._health; }
  getErrorCount(sev?: ErrorSeverity) {
    return sev ? this._errors.filter(e => e.severity === sev).length : this._errors.length;
  }
  getCriticalCount() { return this.getErrorCount('critical') + this.getErrorCount('error'); }

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn);
    fn(this.getErrors(), this._health);
    return () => this._listeners.delete(fn);
  }

  reportComponentError(error: Error, componentStack?: string) {
    this._add({
      category: 'component_crash',
      severity: 'critical',
      message:  error?.message ?? String(error),
      source:   'React Error Boundary',
      stack:    (error?.stack ?? '') + (componentStack ?? ''),
    });
  }

  async clearAll() {
    this._errors = [];
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    this._emit();
  }

  async attemptFix(id: string): Promise<string> {
    const e = this._errors.find(x => x.id === id);
    if (!e) return 'Error not found';
    const pattern = this._FIX_PATTERNS.find(p => p.match(e));
    if (!pattern) {
      this._mutate(id, { fixAttempted: true, fixResult: 'No auto-fix available for this error type' });
      return 'No fix available';
    }
    try {
      const result = await pattern.fix(e);
      this._mutate(id, { fixAttempted: true, autoFixed: true, fixResult: result });
      this._add({ category: 'auto_fix', severity: 'info', message: `Fixed: ${e.message.slice(0, 80)}`, source: pattern.label });
      return result;
    } catch (err: any) {
      const msg = err?.message ?? 'Fix failed';
      this._mutate(id, { fixAttempted: true, fixResult: msg });
      return msg;
    }
  }

  async attemptFixAll() {
    const unfixed = this._errors.filter(e => !e.autoFixed && !e.fixAttempted && e.severity !== 'info');
    await Promise.allSettled(unfixed.map(e => this.attemptFix(e.id)));
  }

  // ── Boot ─────────────────────────────────────────────────────────
  async init() {
    if (this._started) return;
    this._started = true;
    await this._loadPersisted();
    this._installGlobalJsHandler();
    this._installPromiseRejectionHandler();
    this._installFetchInterceptor();
    this._installConsoleInterceptors();
    this._startHealthLoop();
  }

  // ── 1. Global JS error handler ───────────────────────────────────
  private _installGlobalJsHandler() {
    try {
      const EU: any = (global as any).ErrorUtils;
      if (!EU?.setGlobalHandler) return;
      const prev = EU.getGlobalHandler?.() ?? null;
      EU.setGlobalHandler((err: Error, isFatal?: boolean) => {
        try {
          const msg = err?.message ?? String(err ?? 'Unknown JS error');
          // Filter out known noisy non-bugs
          const noisy = [
            'Network request failed', 'AbortError', 'TypeError: undefined is not an object',
            'Cannot read property', 'No handler registered', 'SplashScreen.hide',
          ];
          const isNoisy = noisy.some(n => msg.includes(n));
          this._add({
            category: 'js_crash',
            severity: isFatal ? 'critical' : isNoisy ? 'warning' : 'error',
            message:  msg.slice(0, 400),
            source:   'Global ErrorUtils',
            stack:    typeof err?.stack === 'string' ? err.stack.slice(0, 1000) : undefined,
          });
        } catch {}
        try { prev?.(err, isFatal); } catch {}
      });
    } catch {}
  }

  // ── 2. Unhandled promise rejections ─────────────────────────────
  private _installPromiseRejectionHandler() {
    try {
      const orig = (global as any).onunhandledrejection;
      (global as any).onunhandledrejection = (event: any) => {
        try {
          const reason = event?.reason;
          const msg = reason?.message ?? String(reason ?? 'Unhandled rejection');
          if (msg.includes('Network request failed') || msg.includes('AbortError')) {
            // Covered by fetch interceptor
          } else {
            this._add({
              category: 'unhandled_promise',
              severity: 'error',
              message:  msg.slice(0, 400),
              source:   'Unhandled Promise',
              stack:    reason?.stack?.slice(0, 600),
            });
          }
        } catch {}
        try { orig?.(event); } catch {}
      };
    } catch {}
  }

  // ── 3. fetch() interceptor ────────────────────────────────────────
  // Health-check endpoints that are expected to fail when server is offline.
  // Never log errors for these — they fire constantly by design.
  private _isHealthCheckUrl(url: string): boolean {
    const HEALTH_PATHS = ['/api/status', '/api/health', '/api/metrics', '/api/ping', '/api/info'];
    return HEALTH_PATHS.some(p => url.includes(p));
  }

  private _isServerConnected(): boolean {
    try {
      const { serverConnection } = require('./serverConnection');
      return serverConnection.isConnected?.() ?? false;
    } catch { return false; }
  }

  private _installFetchInterceptor() {
    try {
      if (!(global as any).fetch) return;
      this._origFetch = (global as any).fetch;
      const self = this;
      (global as any).fetch = async function patchedFetch(input: any, init?: any): Promise<Response> {
        const url = typeof input === 'string' ? input : (input as Request)?.url ?? 'unknown';
        const startMs = Date.now();
        // Completely ignore health-check endpoints when server is not connected.
        // These fire every 30s from multiple services and are never actionable when offline.
        const isHealthCheck = self._isHealthCheckUrl(url);
        try {
          const res = await self._origFetch!.call(this, input, init);
          const latency = Date.now() - startMs;
          // Only log failed HTTP responses for non-health-check URLs
          if (!res.ok && !isHealthCheck && res.status !== 404 && !(res.status === 401 && url.includes('/api/status'))) {
            self._add({
              category:   'network',
              severity:   res.status >= 500 ? 'error' : 'warning',
              message:    `HTTP ${res.status} — ${url.replace(/https?:\/\/[^/]+/, '')}`,
              source:     'fetch() interceptor',
              url,
              statusCode: res.status,
            });
          }
          // Log very slow responses (> 8s) only for connected server calls
          if (latency > 8000 && self._isServerConnected() && !isHealthCheck) {
            self._add({
              category: 'network',
              severity: 'warning',
              message:  `Slow request ${latency}ms — ${url.replace(/https?:\/\/[^/]+/, '')}`,
              source:   'fetch() interceptor',
              url,
            });
          }
          return res;
        } catch (err: any) {
          const msg = err?.message ?? 'Network error';
          // Completely suppress:
          //  1. AbortError — normal cancellation (timeouts, unmount)
          //  2. Health-check failures when server is offline — expected
          //  3. "Network request failed" on known health endpoints
          const isAbort = msg.includes('AbortError') || msg.includes('aborted');
          const isExpectedOffline = isHealthCheck && !self._isServerConnected();
          if (!isAbort && !isExpectedOffline) {
            self._add({
              category: 'network',
              severity: 'warning',
              message:  `${msg.slice(0, 120)} — ${url.replace(/https?:\/\/[^/]+/, '').slice(0, 80)}`,
              source:   'fetch() interceptor',
              url,
            });
          }
          throw err;
        }
      };
    } catch {}
  }

  // ── 4. console.error / console.warn interceptors ─────────────────
  private _installConsoleInterceptors() {
    try {
      this._origConsoleError = console.error.bind(console);
      this._origConsoleWarn  = console.warn.bind(console);

      const self = this;

      console.error = function (...args: any[]) {
        try {
          const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ').slice(0, 400);
          // Filter: exclude Metro/bundler noise and our own logger
          if (!msg.includes('[AutoErrorLogger') && !msg.includes('[RuntimeErrorMonitor') && !msg.includes('Warning: Each child')) {
            self._add({ category: 'console_error', severity: 'error', message: msg, source: 'console.error' });
          }
        } catch {}
        self._origConsoleError?.(...args);
      };

      console.warn = function (...args: any[]) {
        try {
          const msg = args.map(a => typeof a === 'string' ? a : (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ').slice(0, 300);
          // Very selective — only log actionable warnings
          const actionable = [
            'Non-serializable', 'VirtualizedList', 'FlexLayout', 'Warning: Failed prop',
            'Warning: componentWill', 'undefined is not', 'Cannot update', 'Maximum update depth',
          ];
          if (actionable.some(k => msg.includes(k))) {
            self._add({ category: 'console_warn', severity: 'warning', message: msg, source: 'console.warn' });
          }
        } catch {}
        self._origConsoleWarn?.(...args);
      };
    } catch {}
  }

  // ── 5. Periodic health checks ─────────────────────────────────────
  private _startHealthLoop() {
    // First check after 15s (let app settle)
    setTimeout(() => { this._runHealthCheck().catch(() => {}); }, 15_000);
    this._timer = setInterval(() => {
      this._runHealthCheck().catch(() => {});
    }, HEALTH_INTERVAL_MS);
  }

  private async _runHealthCheck() {
    const snap: HealthSnapshot = {
      ts: Date.now(),
      server: 'offline',
      serverLatency: 0,
      storage: 'ok',
      storageUsedKB: 0,
      services: {
        serverConnection: false,
        autoErrorLogger: false,
        knowledgeAccumulator: false,
        executionHistory: false,
      },
      errorCount: this._errors.length,
      criticalCount: this.getCriticalCount(),
    };

    // Check server — only probe if app thinks it's connected
    try {
      const { serverConnection } = require('./serverConnection');
      snap.services.serverConnection = true;
      const connected = serverConnection.isConnected?.();
      if (connected) {
        const ip   = serverConnection.getIP();
        const port = serverConnection.getPort();
        if (ip && port) {
          const t0 = Date.now();
          const ctrl = new AbortController();
          setTimeout(() => ctrl.abort(), 5000);
          try {
            const tok = serverConnection.getToken?.() ?? '';
            const headers: Record<string, string> = {};
            if (tok) headers['Authorization'] = 'Bearer ' + tok;
            // Use _origFetch to bypass our interceptor (no double-logging)
            const res = await (this._origFetch ?? fetch)(`http://${ip}:${port}/api/status`, {
              headers, signal: ctrl.signal,
            });
            snap.serverLatency = Date.now() - t0;
            snap.server = res.ok ? 'ok' : 'degraded';
            // Only log non-auth failures — 401 is handled by token refresh
            if (!res.ok && res.status !== 401) {
              this._add({ category: 'health_check', severity: 'warning', message: `Server returned ${res.status} on /api/status`, source: 'Health Monitor' });
            }
          } catch (e: any) {
            snap.server = 'offline';
            // Only log if it was NOT an AbortError (timeout is expected on slow networks)
            const eMsg = e?.message ?? '';
            if (!eMsg.includes('AbortError') && !eMsg.includes('aborted') && !eMsg.includes('Network request failed')) {
              this._add({ category: 'health_check', severity: 'warning', message: `Server lost: ${eMsg.slice(0, 80)}`, source: 'Health Monitor' });
            }
          }
        }
      }
      // If not connected, just mark offline silently — no log needed
    } catch {}

    // Check AsyncStorage
    try {
      const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
      let totalBytes = 0;
      const sample = Array.from(keys).slice(0, 20);
      await Promise.allSettled(sample.map(async k => {
        try {
          const v = await AsyncStorage.getItem(k);
          totalBytes += (v?.length ?? 0) * 2;
        } catch {}
      }));
      // Extrapolate from sample
      const estimated = keys.length > 0 ? (totalBytes / sample.length) * keys.length : totalBytes;
      snap.storageUsedKB = Math.round(estimated / 1024);
      snap.storage = snap.storageUsedKB > 4096 ? 'warn' : 'ok';
      if (snap.storageUsedKB > 5120) {
        this._add({ category: 'storage', severity: 'warning', message: `AsyncStorage ~${snap.storageUsedKB}KB — approaching limit`, source: 'Health Monitor' });
      }
    } catch {
      snap.storage = 'error';
    }

    // Check services
    try { require('./autoErrorLogger');  snap.services.autoErrorLogger = true; } catch {}
    try { require('./knowledgeAccumulator'); snap.services.knowledgeAccumulator = true; } catch {}
    try { require('./executionHistory'); snap.services.executionHistory = true; } catch {}

    this._health = snap;
    this._emit();
  }

  // ── Internal helpers ─────────────────────────────────────────────
  private _add(partial: Omit<RuntimeError, 'id' | 'ts' | 'autoFixed' | 'fixAttempted' | 'count'>) {
    try {
      // Dedupe: if same message within last 5 minutes, increment count only
      const recent = this._errors.find(e =>
        e.message === partial.message &&
        e.category === partial.category &&
        Date.now() - e.ts < 5 * 60_000
      );
      if (recent) {
        recent.count++;
        recent.ts = Date.now();
        this._emit();
        return;
      }

      const entry: RuntimeError = {
        ...partial,
        id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ts: Date.now(),
        autoFixed: false,
        fixAttempted: false,
        count: 1,
      };
      this._errors.push(entry);
      if (this._errors.length > MAX_ENTRIES) {
        this._errors = this._errors.slice(-MAX_ENTRIES);
      }
      this._persist();
      this._emit();

      // Auto-attempt fix for critical errors
      if (entry.severity === 'critical' || entry.severity === 'error') {
        setTimeout(() => this.attemptFix(entry.id).catch(() => {}), 500);
      }
    } catch {}
  }

  private _mutate(id: string, patch: Partial<RuntimeError>) {
    const idx = this._errors.findIndex(e => e.id === id);
    if (idx >= 0) {
      this._errors[idx] = { ...this._errors[idx], ...patch };
      this._emit();
    }
  }

  private _emit() {
    this._listeners.forEach(fn => { try { fn(this.getErrors(), this._health); } catch {} });
  }

  private _persist() {
    // Fire-and-forget persist (keep last 50 for startup)
    try {
      const toSave = this._errors.slice(-50);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
    } catch {}
  }

  private async _loadPersisted() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr: RuntimeError[] = JSON.parse(raw);
        // Only load recent entries (< 24h old)
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        this._errors = Array.isArray(arr) ? arr.filter(e => e.ts > cutoff) : [];
      }
    } catch {}
  }

  // ── Auto-fix patterns ─────────────────────────────────────────────
  private readonly _FIX_PATTERNS: FixPattern[] = [
    // Network: reconnect server
    {
      label: 'Network: Reconnect server',
      match: e => e.category === 'network' || (e.category === 'health_check' && e.message.includes('unreachable')),
      fix:   async () => {
        const { serverConnection } = require('./serverConnection');
        const { autoConnectEngine } = require('./autoConnectEngine');
        autoConnectEngine.notifyDisconnected();
        const result = await serverConnection.reconnect().catch(() => null);
        return result?.connected ? 'Reconnected successfully' : 'Reconnect queued — engine will retry';
      },
    },
    // HTTP 401: refresh token
    {
      label: 'Auth: Refresh token',
      match: e => e.statusCode === 401 || e.message.includes('401') || e.message.includes('Unauthorized'),
      fix:   async () => {
        const { serverConnection } = require('./serverConnection');
        const ip   = serverConnection.getIP();
        const port = serverConnection.getPort();
        if (!ip || !port) return 'No server IP stored';
        const result = await serverConnection.connectManual(ip, port).catch((err: any) => ({ success: false, error: err?.message }));
        return (result as any).success ? 'Token refreshed via re-pair' : 'Re-pair required — open QR scanner';
      },
    },
    // HTTP 500: log and suggest server restart
    {
      label: 'Server: 500 error handler',
      match: e => e.statusCode === 500 || (e.category === 'network' && e.message.includes('500')),
      fix:   async (e) => {
        // Log to autoErrorLogger for persistent record
        const { autoErrorLogger } = require('./autoErrorLogger');
        autoErrorLogger.error('AutoFix', `Server 500 on ${e.url ?? 'unknown URL'}`);
        return 'Logged server 500 — restart butler_server.py if persistent';
      },
    },
    // Storage bloat: prune old KB data
    {
      label: 'Storage: Prune KB cache',
      match: e => e.category === 'storage' && e.message.includes('AsyncStorage'),
      fix:   async () => {
        const { autoHeal } = require('./autoHeal');
        // Trigger heal cycle manually
        (autoHeal as any)._storageChecked = 0;
        await (autoHeal as any)._checkStoragePressure?.().catch(() => {});
        return 'Storage prune triggered';
      },
    },
    // JS crash / component crash: clear relevant cache keys
    {
      label: 'JS Crash: Clear render cache',
      match: e => (e.category === 'js_crash' || e.category === 'component_crash') && !e.message.includes('Network'),
      fix:   async () => {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.multiRemove([
          '@butler_boot_error_log_v1',
          'butler_crash_log_v1',
          '@butler_last_crash_v2',
        ]).catch(() => {});
        return 'Crash cache cleared — no loop on next launch';
      },
    },
    // Slow network: no-op but inform
    {
      label: 'Network: Slow request note',
      match: e => e.category === 'network' && e.message.includes('Slow request'),
      fix:   async () => 'Slow response logged — check server CPU load via metrics tab',
    },
  ];
}

export const runtimeErrorMonitor = RuntimeErrorMonitorService.getInstance();
