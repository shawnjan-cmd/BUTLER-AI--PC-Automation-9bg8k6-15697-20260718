/**
 * Auto Error Logger — lightweight error capture service
 * Stores errors in AsyncStorage for debugging without crashing the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { redactDiagnosticText, sanitizeDiagnosticMeta } from './privateDataPolicy';

const MAX_LOGS = 50;
const STORAGE_KEY = '@butler_auto_error_logs_v1';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface ErrorLogEntry {
  id: string;
  level: LogLevel;
  source: string;
  message: string;
  stack?: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

const VALID_LEVELS = new Set<LogLevel>(['error', 'warn', 'info', 'debug']);

function sanitizeEntry(value: unknown): ErrorLogEntry | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<ErrorLogEntry>;
  if (!raw.level || !VALID_LEVELS.has(raw.level)) return null;
  return {
    id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : `restored-${Date.now()}`,
    level: raw.level,
    source: redactDiagnosticText(String(raw.source ?? 'unknown'), 90),
    message: redactDiagnosticText(String(raw.message ?? ''), 500),
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
    meta: sanitizeDiagnosticMeta(raw.meta),
  };
}

class AutoErrorLogger {
  private _buffer: ErrorLogEntry[] = [];
  private _loaded = false;
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  /** Log an error or message */
  log(level: LogLevel, source: string, message: string, meta?: Record<string, any>): void {
    const entry: ErrorLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level,
      source: redactDiagnosticText(source, 90),
      message: redactDiagnosticText(message, 500),
      timestamp: Date.now(),
      meta: sanitizeDiagnosticMeta(meta),
    };

    this._buffer.push(entry);
    if (this._buffer.length > MAX_LOGS) {
      this._buffer = this._buffer.slice(-MAX_LOGS);
    }

    // Debounced persist
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._persist(), 1500);

    // Keep verbose diagnostic output in development only. Production has local,
    // redacted records but never mirrors private details to system logs.
    if (__DEV__) {
      const prefix = `[AutoErrorLogger:${entry.source}]`;
      if (level === 'error') console.error(prefix, entry.message, entry.meta || '');
      else if (level === 'warn') console.warn(prefix, entry.message, entry.meta || '');
      else console.log(prefix, `[${level.toUpperCase()}]`, entry.message, entry.meta || '');
    }
  }

  /** Convenience wrappers */
  error(source: string, message: string, meta?: Record<string, any>): void {
    this.log('error', source, message, meta);
  }

  warn(source: string, message: string, meta?: Record<string, any>): void {
    this.log('warn', source, message, meta);
  }

  /**
   * Backward-compat alias used by older callers (serverMetrics, etc).
   * @deprecated use warn() instead.
   */
  logWarning(source: string, message: string, meta?: Record<string, any>): void {
    this.log('warn', source, message, meta);
  }

  /**
   * Quick statistics about the in-memory log buffer.
   * Returns both the legacy shape (errorCount/warningCount/totalLogs) used
   * by services like appScanner, AND the new (total/byLevel) shape.
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    totalLogs: number;
  } {
    const byLevel: Record<LogLevel, number> = { error: 0, warn: 0, info: 0, debug: 0 };
    for (const entry of this._buffer) {
      if (entry && entry.level && byLevel[entry.level] !== undefined) {
        byLevel[entry.level]++;
      }
    }
    return {
      total: this._buffer.length,
      byLevel,
      errorCount:   byLevel.error,
      warningCount: byLevel.warn,
      infoCount:    byLevel.info,
      totalLogs:    this._buffer.length,
    };
  }

  info(source: string, message: string, meta?: Record<string, any>): void {
    this.log('info', source, message, meta);
  }

  /** Load persisted logs from storage */
  async load(): Promise<ErrorLogEntry[]> {
    if (this._loaded) return this._buffer;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown[] = JSON.parse(raw);
        this._buffer = Array.isArray(parsed)
          ? parsed.map(sanitizeEntry).filter((entry): entry is ErrorLogEntry => !!entry).slice(-MAX_LOGS)
          : [];
        // Persist the redacted migration so prior logs cannot survive unfiltered.
        void this._persist();
      }
    } catch {}
    this._loaded = true;
    return this._buffer;
  }

  /** Get all logs (most recent first) */
  getLogs(level?: LogLevel): ErrorLogEntry[] {
    const logs = [...this._buffer].reverse();
    return level ? logs.filter(l => l.level === level) : logs;
  }

  /** Clear all logs */
  async clear(): Promise<void> {
    this._buffer = [];
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
  }

  private async _persist(): Promise<void> {
    this._saveTimer = null;
    try {
      const persisted = this._buffer.filter((entry) => entry.level === 'error' || entry.level === 'warn');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {}
  }
}

export const autoErrorLogger = new AutoErrorLogger();
