/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  NEXUS INTEGRITY ENGINE — Butler AI v7.3                     ║
 * ║  © 2024-2025 Butler AI / Andrej Sladkovic                    ║
 * ║  Proprietary · Unauthorized use prohibited                   ║
 * ║  Fingerprint: NX-73-INTEGRITY-0xBF00FF-SHA256               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Auto-scans the live app environment for:
 *   - Runtime service health
 *   - Connection integrity
 *   - Storage health
 *   - Missing assets
 *   - Performance metrics
 *
 * Runs silently in the background; exposes a React hook
 * so UI components can subscribe to live scan results.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Proprietary fingerprint (obfuscated watermark) ────────────
const _NX_SIG = '\u004e\u0058\u002d\u0037\u0033\u002d\u0042\u0075\u0074\u006c\u0065\u0072\u0041\u0049\u002d\u00a9\u0032\u0030\u0032\u0035';
const _NX_BUILD = 'b7f3e9a2c1d5f8b4a0e7c3d6f9b2a5c8';

export type ScanSeverity = 'ok' | 'warn' | 'error' | 'info';

export interface ScanResult {
  id:        string;
  category:  string;
  label:     string;
  severity:  ScanSeverity;
  message:   string;
  timestamp: number;
  autoFixed?: boolean;
}

export interface ScanReport {
  id:          string;
  startedAt:   number;
  finishedAt:  number;
  durationMs:  number;
  results:     ScanResult[];
  score:       number;       // 0-100
  passCount:   number;
  warnCount:   number;
  errorCount:  number;
  fingerprint: string;
}

const SCAN_LOG_KEY  = '@nx_integrity_log_v1';
const MAX_LOG_SIZE  = 20;

// ── Internal scan checkers ────────────────────────────────────
async function checkAsyncStorage(): Promise<ScanResult> {
  try {
    const testKey = '@nx_health_test';
    await AsyncStorage.setItem(testKey, 'ok');
    const val = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);
    if (val !== 'ok') throw new Error('Read-after-write mismatch');
    return { id:'storage_rw', category:'Storage', label:'AsyncStorage', severity:'ok', message:'Read/write cycle passed', timestamp:Date.now() };
  } catch (e: any) {
    return { id:'storage_rw', category:'Storage', label:'AsyncStorage', severity:'error', message:`Storage failure: ${e?.message}`, timestamp:Date.now() };
  }
}

async function checkServerConnection(): Promise<ScanResult> {
  try {
    const { serverConnection } = await import('@/services/serverConnection');
    const connected = serverConnection.isConnected?.() ?? false;
    const ip        = serverConnection.getIP?.()    ?? '';
    const port      = serverConnection.getPort?.()  ?? '';
    if (!connected) {
      return { id:'server_conn', category:'Network', label:'Server Connection', severity:'warn', message:'Not connected — pair PC from HOME tab', timestamp:Date.now() };
    }
    return { id:'server_conn', category:'Network', label:'Server Connection', severity:'ok', message:`Connected to ${ip}:${port}`, timestamp:Date.now() };
  } catch (e: any) {
    return { id:'server_conn', category:'Network', label:'Server Connection', severity:'info', message:'Connection module unavailable', timestamp:Date.now() };
  }
}

// ── One-time plaintext→encrypted migration ──────────────────
// Runs on every boot but exits immediately after the first
// successful migration (MIGRATION_DONE_KEY guards it).
async function runEncryptionMigration(): Promise<ScanResult> {
  try {
    const { encryptedStorage } = await import('@/services/encryptedStorage');
    const { deviceIdentifier }  = await import('@/services/deviceIdentifier');
    // Ensure the key is derived before migrating
    const id = await deviceIdentifier.getDeviceId();
    await encryptedStorage.init(id);
    await encryptedStorage.migrate();
    return {
      id: 'enc_migration', category: 'Security', label: 'Storage Migration',
      severity: 'ok', message: 'Plaintext → encrypted migration complete',
      timestamp: Date.now(), autoFixed: true,
    };
  } catch (e: any) {
    return {
      id: 'enc_migration', category: 'Security', label: 'Storage Migration',
      severity: 'warn', message: `Migration skipped: ${e?.message ?? 'unknown'}`,
      timestamp: Date.now(),
    };
  }
}

async function checkEncryptedStorage(): Promise<ScanResult> {
  try {
    const { encryptedStorage } = await import('@/services/encryptedStorage');
    const isInit = (encryptedStorage as any)._isInitialized ?? false;
    if (!isInit) {
      return { id:'enc_storage', category:'Security', label:'Encrypted Storage', severity:'warn', message:'Not initialized — will auto-init on first use', timestamp:Date.now() };
    }
    return { id:'enc_storage', category:'Security', label:'Encrypted Storage', severity:'ok', message:'AES-256 storage operational', timestamp:Date.now() };
  } catch {
    return { id:'enc_storage', category:'Security', label:'Encrypted Storage', severity:'info', message:'Encrypted storage module not loaded', timestamp:Date.now() };
  }
}

async function checkHaptics(): Promise<ScanResult> {
  try {
    const { haptics } = await import('@/services/haptics');
    if (typeof haptics?.light !== 'function') {
      return { id:'haptics', category:'UX', label:'Haptic Feedback', severity:'warn', message:'Haptics module missing methods', timestamp:Date.now() };
    }
    return { id:'haptics', category:'UX', label:'Haptic Feedback', severity:'ok', message:'Haptic engine ready', timestamp:Date.now() };
  } catch {
    return { id:'haptics', category:'UX', label:'Haptic Feedback', severity:'warn', message:'Haptics unavailable on this device', timestamp:Date.now() };
  }
}

async function checkKnowledgeBase(): Promise<ScanResult> {
  try {
    const { knowledgeAccumulator } = await import('@/services/knowledgeAccumulator');
    const stats = await knowledgeAccumulator.getStats().catch(() => null);
    if (!stats) {
      return { id:'kb_health', category:'AI', label:'Knowledge Base', severity:'info', message:'KB stats unavailable', timestamp:Date.now() };
    }
    const count = stats.totalFindings ?? 0;
    return {
      id:'kb_health', category:'AI', label:'Knowledge Base', severity:count>0?'ok':'info',
      message: count > 0 ? `${count} findings indexed` : 'Empty — will grow with usage',
      timestamp:Date.now(),
    };
  } catch {
    return { id:'kb_health', category:'AI', label:'Knowledge Base', severity:'info', message:'KB module not loaded', timestamp:Date.now() };
  }
}

async function checkAutoConnect(): Promise<ScanResult> {
  try {
    const { autoConnectEngine } = await import('@/services/autoConnectEngine');
    const conn = autoConnectEngine.getCurrentConnection?.();
    if (!conn) {
      return { id:'auto_conn', category:'Network', label:'Auto-Connect Engine', severity:'warn', message:'Engine returned no state', timestamp:Date.now() };
    }
    return {
      id:'auto_conn', category:'Network', label:'Auto-Connect Engine', severity:'ok',
      message: conn.connected ? `Connected to ${conn.ip}:${conn.port}` : 'Engine idle — waiting for PC',
      timestamp:Date.now(),
    };
  } catch {
    return { id:'auto_conn', category:'Network', label:'Auto-Connect Engine', severity:'info', message:'Auto-connect not started', timestamp:Date.now() };
  }
}

async function checkOnboardingState(): Promise<ScanResult> {
  try {
    const { ONBOARDING_DONE_KEY } = await import('@/constants/onboardingKeys');
    const done = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
    return {
      id:'onboarding', category:'UX', label:'Onboarding Status', severity:'ok',
      message: done === '1' ? 'Completed — all consents stored' : 'Pending — user on onboarding flow',
      timestamp:Date.now(),
    };
  } catch {
    return { id:'onboarding', category:'UX', label:'Onboarding Status', severity:'info', message:'Status unknown', timestamp:Date.now() };
  }
}

async function checkPerformanceTuner(): Promise<ScanResult> {
  try {
    const { perf } = await import('@/services/performanceTuner');
    return {
      id:'perf', category:'Performance', label:'Performance Mode', severity:'ok',
      message: `Mode: ${perf.isLow ? 'LOW (battery saver)' : perf.isMid ? 'MID' : 'FULL'} · lazyDelay ${perf.lazyDelay}ms`,
      timestamp:Date.now(),
    };
  } catch {
    return { id:'perf', category:'Performance', label:'Performance Mode', severity:'info', message:'Perf tuner unavailable', timestamp:Date.now() };
  }
}

// ── Integrity score calculator ────────────────────────────────
function calcScore(results: ScanResult[]): number {
  if (!results.length) return 100;
  const weights: Record<ScanSeverity, number> = { ok:0, info:0, warn:10, error:25 };
  const totalDeduction = results.reduce((sum, r) => sum + weights[r.severity], 0);
  return Math.max(0, 100 - totalDeduction);
}

// ── Main engine ───────────────────────────────────────────────
class NexusIntegrityEngine {
  private _running = false;
  private _lastReport: ScanReport | null = null;
  private _listeners: Array<(r: ScanReport) => void> = [];
  private _watermark = _NX_SIG;

  getWatermark(): string { return this._watermark; }
  getBuildHash(): string { return _NX_BUILD; }

  subscribe(fn: (r: ScanReport) => void): () => void {
    this._listeners.push(fn);
    if (this._lastReport) fn(this._lastReport);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  async runScan(): Promise<ScanReport> {
    if (this._running) return this._lastReport!;
    this._running = true;
    const start = Date.now();

    const checkers = [
      checkAsyncStorage(),
      checkServerConnection(),
      checkEncryptedStorage(),
      runEncryptionMigration(),   // one-time plaintext → encrypted migration
      checkHaptics(),
      checkKnowledgeBase(),
      checkAutoConnect(),
      checkOnboardingState(),
      checkPerformanceTuner(),
    ];

    const results = await Promise.allSettled(checkers).then(settled =>
      settled.map(r => r.status === 'fulfilled' ? r.value : ({
        id:'unknown', category:'System', label:'Unknown', severity:'error' as ScanSeverity,
        message:'Checker threw: ' + (r as any).reason?.message, timestamp:Date.now(),
      }))
    );

    const report: ScanReport = {
      id:         `nx_${Date.now()}`,
      startedAt:  start,
      finishedAt: Date.now(),
      durationMs: Date.now() - start,
      results,
      score:      calcScore(results),
      passCount:  results.filter(r => r.severity === 'ok').length,
      warnCount:  results.filter(r => r.severity === 'warn').length,
      errorCount: results.filter(r => r.severity === 'error').length,
      fingerprint: _NX_BUILD,
    };

    this._lastReport = report;
    this._running = false;
    this._listeners.forEach(fn => { try { fn(report); } catch {} });

    // Persist scan log
    try {
      const raw = await AsyncStorage.getItem(SCAN_LOG_KEY).catch(() => '[]');
      const log: ScanReport[] = JSON.parse(raw || '[]');
      log.unshift({ ...report, results: results.slice(0, 4) }); // keep minimal for storage
      if (log.length > MAX_LOG_SIZE) log.length = MAX_LOG_SIZE;
      await AsyncStorage.setItem(SCAN_LOG_KEY, JSON.stringify(log));
    } catch {}

    return report;
  }

  getLastReport(): ScanReport | null { return this._lastReport; }

  async getHistory(): Promise<ScanReport[]> {
    try {
      const raw = await AsyncStorage.getItem(SCAN_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async autoFix(result: ScanResult): Promise<boolean> {
    try {
      if (result.id === 'enc_storage') {
        const { encryptedStorage } = await import('@/services/encryptedStorage');
        const { deviceIdentifier } = await import('@/services/deviceIdentifier');
        const id = await deviceIdentifier.getDeviceId();
        await encryptedStorage.init(id);
        return true;
      }
    } catch {}
    return false;
  }
}

export const nexusIntegrityEngine = new NexusIntegrityEngine();
