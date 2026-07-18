/**
 * JSON GUARD SERVICE — Butler AI v7.6
 * Auto-updating thresholds · Undo stack · Warnings-only (never blocks)
 *
 * v7.6: Replaced localStorage with AsyncStorage.
 * localStorage does not exist in React Native — every read/write was silently
 * no-opping on Android, so snapshots, undo stack, and import log were never
 * persisted across app restarts. Now correctly uses AsyncStorage.
 *
 * KEY CHANGE from v7.4: NOTHING IS EVER BLOCKED.
 * All threshold checks produce WARNINGS only — the import always proceeds.
 * After each successful import, KNOWN_MINIMUMS auto-updates to match the
 * actual line counts so the guard stays in sync forever.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── AsyncStorage wrapper (replaces localStorage which doesn't exist in RN) ──
const AS = {
  getItem: async (k: string): Promise<string | null> => {
    try { return await AsyncStorage.getItem(k); } catch { return null; }
  },
  setItem: async (k: string, v: string): Promise<void> => {
    try { await AsyncStorage.setItem(k, v); } catch {}
  },
  removeItem: async (k: string): Promise<void> => {
    try { await AsyncStorage.removeItem(k); } catch {}
  },
};

const KEY_SNAPSHOTS     = '@butler_json_guard_snapshots_v1';
const KEY_IMPORT_LOG    = '@butler_json_guard_importlog_v1';
const KEY_LAST_HASH     = '@butler_json_guard_lasthash_v1';
const KEY_CACHE_CLEARED = '@butler_json_guard_cache_ts_v1';
const KEY_MINIMUMS      = '@butler_json_guard_minimums_v1';
const KEY_UNDO_STACK    = '@butler_json_guard_undo_v1';

export interface FileInfo { path: string; lines: number; chars: number; }
export interface GuardSnapshot {
  ts: number; label: string; files: FileInfo[];
  totalLines: number; totalChars: number; hash: string;
}
export interface ImportDiff {
  path: string; prevLines: number; newLines: number; delta: number;
  status: 'added' | 'removed' | 'grown' | 'shrunk' | 'unchanged' | 'truncated';
}
export interface GuardResult {
  ok: boolean; blocked: false; warnings: string[]; errors: string[];
  diffs: ImportDiff[]; truncatedFiles: string[]; integrityOk: boolean;
  overrideNeeded: false; summary: string;
}
export interface ImportLogEntry {
  ts: number; label: string; filesCount: number;
  warnings: number; ok: boolean; diffs: ImportDiff[];
}
export interface UndoEntry {
  ts: number; label: string; snapshot: Record<string, any>;
}

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) ^ str.charCodeAt(i); h = h | 0; }
  return Math.abs(h).toString(36).padStart(7, '0');
}

function hashFiles(files: FileInfo[]): string {
  if (!files || files.length === 0) return 'empty';
  const combined = files.slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(f => `${f.path}:${f.lines}:${djb2(f.path + f.lines)}`)
    .join('|');
  return djb2(combined);
}

// Default minimums — auto-updated after each successful import.
// These are soft warnings only, never blockers.
const DEFAULT_MINIMUMS: Record<string, number> = {
  'app/(tabs)/_layout.tsx':    180,
  'app/(tabs)/nexushome.tsx':  250,
  'app/(tabs)/scripts.tsx':    300,
  'app/(tabs)/butler.tsx':     200,
  'app/(tabs)/settings.tsx':   100,
  'app/(tabs)/knowledge.tsx':  250,
  'app/(tabs)/onboarding.tsx': 150,
  'app/_layout.tsx':            40,
  'services/serverConnection.ts': 50,
  'services/autoConnectEngine.ts': 50,
};

const CACHE_KEYS_TO_CLEAR = [
  '@butler_boot_error_log_v1',
  'butler_crash_log_v1',
  '@ph_token_overrides_v1',
  '@ph_nav_overrides_v1',
  '@butler_json_guard_lasthash_v1',
];

function collectFiles(json: Record<string, any>): FileInfo[] {
  const out: FileInfo[] = [];
  const push = (path: string, content: string) => {
    if (path && content) out.push({ path, lines: content.split('\n').length, chars: content.length });
  };
  try {
    for (const [k, v] of Object.entries(json)) {
      if (v && typeof v === 'object') {
        if ((v as any).type === 'source' && typeof (v as any).content === 'string') {
          push(k, (v as any).content);
        } else if (typeof (v as any).lines === 'number' && typeof (v as any).path === 'string') {
          out.push({ path: (v as any).path, lines: (v as any).lines, chars: (v as any).content?.length || 0 });
        }
      }
    }
    if (json.source_export && typeof json.source_export === 'object') {
      for (const [k, v] of Object.entries(json.source_export)) {
        if (v && typeof v === 'object' && (v as any).type === 'source' && typeof (v as any).content === 'string') {
          push(k, (v as any).content);
        }
      }
    }
  } catch {}
  return out;
}

class JsonGuardService {
  private _minimums: Record<string, number> = { ...DEFAULT_MINIMUMS };
  private _minimumsLoaded = false;

  private async _ensureMinimumsLoaded() {
    if (this._minimumsLoaded) return;
    this._minimumsLoaded = true;
    try {
      const raw = await AS.getItem(KEY_MINIMUMS);
      if (raw) {
        const loaded = JSON.parse(raw);
        this._minimums = { ...DEFAULT_MINIMUMS, ...loaded };
      }
    } catch {}
  }

  private async _saveMinimums() {
    try { await AS.setItem(KEY_MINIMUMS, JSON.stringify(this._minimums)); } catch {}
  }

  /** Auto-update KNOWN_MINIMUMS from actual file sizes (75% of actual line count). */
  async updateMinimumsFromFiles(files: FileInfo[]) {
    if (!files || files.length === 0) return;
    await this._ensureMinimumsLoaded();
    let changed = false;
    for (const f of files) {
      if (f.lines > 30) {
        const newMin = Math.floor(f.lines * 0.75);
        const existing = this._minimums[f.path] || 0;
        if (newMin > existing) {
          this._minimums[f.path] = newMin;
          changed = true;
        }
      }
    }
    if (changed) await this._saveMinimums();
  }

  async getMinimums(): Promise<Record<string, number>> {
    await this._ensureMinimumsLoaded();
    return { ...this._minimums };
  }

  async getSnapshots(): Promise<GuardSnapshot[]> {
    try { const r = await AS.getItem(KEY_SNAPSHOTS); return r ? JSON.parse(r) : []; } catch { return []; }
  }

  private async saveSnapshot(snap: GuardSnapshot) {
    try {
      const all = await this.getSnapshots(); all.unshift(snap);
      if (all.length > 10) all.length = 10;
      await AS.setItem(KEY_SNAPSHOTS, JSON.stringify(all));
    } catch {}
  }

  async getLastSnapshot() {
    const all = await this.getSnapshots(); return all[0] || null;
  }

  async getImportLog(): Promise<ImportLogEntry[]> {
    try { const r = await AS.getItem(KEY_IMPORT_LOG); return r ? JSON.parse(r) : []; } catch { return []; }
  }

  private async logImport(entry: ImportLogEntry) {
    try {
      const all = await this.getImportLog(); all.unshift(entry);
      if (all.length > 20) all.length = 20;
      await AS.setItem(KEY_IMPORT_LOG, JSON.stringify(all));
    } catch {}
  }

  async clearLog() {
    await Promise.all([KEY_IMPORT_LOG, KEY_SNAPSHOTS, KEY_LAST_HASH].map(k => AS.removeItem(k)));
  }

  // ── UNDO STACK ───────────────────────────────────────────────────────────

  async pushUndo(label: string, snapshot: Record<string, any>) {
    try {
      const raw = await AS.getItem(KEY_UNDO_STACK);
      const stack: UndoEntry[] = raw ? JSON.parse(raw) : [];
      stack.unshift({ ts: Date.now(), label, snapshot });
      if (stack.length > 5) stack.length = 5;
      await AS.setItem(KEY_UNDO_STACK, JSON.stringify(stack));
    } catch {}
  }

  async popUndo(): Promise<UndoEntry | null> {
    try {
      const raw = await AS.getItem(KEY_UNDO_STACK);
      const stack: UndoEntry[] = raw ? JSON.parse(raw) : [];
      if (stack.length === 0) return null;
      const entry = stack.shift()!;
      await AS.setItem(KEY_UNDO_STACK, JSON.stringify(stack));
      return entry;
    } catch { return null; }
  }

  async peekUndo(): Promise<UndoEntry | null> {
    try {
      const raw = await AS.getItem(KEY_UNDO_STACK);
      const stack: UndoEntry[] = raw ? JSON.parse(raw) : [];
      return stack[0] || null;
    } catch { return null; }
  }

  async getUndoStack(): Promise<UndoEntry[]> {
    try {
      const raw = await AS.getItem(KEY_UNDO_STACK);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  // ── ANALYSIS — always returns ok:true, never blocks ─────────────────────

  async analyzeImport(json: Record<string, any>, label = 'Import'): Promise<GuardResult> {
    await this._ensureMinimumsLoaded();
    const warnings: string[] = [];
    const errors: string[] = [];
    const diffs: ImportDiff[] = [];
    const truncatedFiles: string[] = [];

    const incomingFiles = collectFiles(json);

    // Check against known minimums — WARNINGS ONLY, never blocked
    for (const file of incomingFiles) {
      const minLines = this._minimums[file.path];
      if (minLines && file.lines < minLines) {
        const pct = Math.round((file.lines / minLines) * 100);
        truncatedFiles.push(file.path);
        warnings.push(`Short file: ${file.path.split('/').pop()} — ${file.lines}L (expected ≥${minLines}, ${pct}%)`);
      }
    }

    const lastSnap = await this.getLastSnapshot();
    if (lastSnap && incomingFiles.length > 0) {
      const prevTotalLines = lastSnap.totalLines;
      const newTotalLines = incomingFiles.reduce((s, f) => s + f.lines, 0);
      const prevMap = new Map(lastSnap.files.map(f => [f.path, f]));

      for (const incoming of incomingFiles) {
        const prev = prevMap.get(incoming.path);
        if (!prev) {
          diffs.push({ path: incoming.path, prevLines: 0, newLines: incoming.lines, delta: incoming.lines, status: 'added' });
        } else {
          const delta = incoming.lines - prev.lines;
          let status: ImportDiff['status'];
          if (delta > 0) status = 'grown';
          else if (delta < -prev.lines * 0.4) status = 'truncated';
          else if (delta < 0) status = 'shrunk';
          else status = 'unchanged';
          diffs.push({ path: incoming.path, prevLines: prev.lines, newLines: incoming.lines, delta, status });
        }
      }

      if (prevTotalLines > 200 && newTotalLines < prevTotalLines * 0.55) {
        const pct = Math.round((newTotalLines / prevTotalLines) * 100);
        warnings.push(`Note: total lines ${prevTotalLines}→${newTotalLines} (${pct}% of previous). Applying anyway.`);
      }
    }

    let integrityOk = true;
    if (json._guard_hash && incomingFiles.length > 0) {
      if (json._guard_hash !== hashFiles(incomingFiles)) {
        warnings.push('Integrity hash mismatch — file may have been modified after export.');
        integrityOk = false;
      }
    }

    const summary = incomingFiles.length > 0
      ? `${incomingFiles.length} file(s) · ${warnings.length} note(s)`
      : 'Runtime config / no source files';

    // ALWAYS ok:true — nothing is ever blocked
    return {
      ok: true,
      blocked: false as const,
      warnings,
      errors,
      diffs,
      truncatedFiles,
      integrityOk,
      overrideNeeded: false as const,
      summary,
    };
  }

  async recordSuccessfulImport(
    json: Record<string, any>, label = 'Import',
    diffs: ImportDiff[] = [], warnings: string[] = []
  ) {
    try {
      const files = collectFiles(json);
      const totalLines = files.reduce((s, f) => s + f.lines, 0);
      const totalChars = files.reduce((s, f) => s + f.chars, 0);
      const hash = (files.length > 0 ? hashFiles(files) : 'nohash') || 'nohash';

      // Auto-update minimums from actual file sizes
      await this.updateMinimumsFromFiles(files);

      await this.saveSnapshot({ ts: Date.now(), label, files, totalLines, totalChars, hash });
      await this.logImport({
        ts: Date.now(), label, filesCount: files.length,
        warnings: warnings.length, ok: true, diffs,
      });
      await AS.setItem(KEY_LAST_HASH, hash);
    } catch {}
  }

  attachGuardHash(exportJson: Record<string, any>) {
    const files = collectFiles(exportJson);
    return { ...exportJson, _guard_hash: hashFiles(files), _guard_ts: Date.now() };
  }

  async clearStaleCaches(): Promise<string[]> {
    const cleared: string[] = [];
    for (const k of CACHE_KEYS_TO_CLEAR) {
      const v = await AS.getItem(k);
      if (v !== null) { await AS.removeItem(k); cleared.push(k); }
    }
    await AS.setItem(KEY_CACHE_CLEARED, String(Date.now()));
    return cleared;
  }

  async getLastCacheClearTs(): Promise<number> {
    const v = await AS.getItem(KEY_CACHE_CLEARED);
    return v ? parseInt(v, 10) : 0;
  }

  generateExportFilename(): string {
    const n = new Date();
    const pad = (x: number) => String(x).padStart(2, '0');
    return `butler_master_${n.getFullYear()}${pad(n.getMonth() + 1)}${pad(n.getDate())}_${pad(n.getHours())}${pad(n.getMinutes())}.json`;
  }

  quickCheck(jsonStr: string): { ok: boolean; error?: string } {
    if (!jsonStr || jsonStr.length < 10) return { ok: false, error: 'Empty or too short' };
    const s = jsonStr.trim();
    if (!s.startsWith('{') && !s.startsWith('[')) return { ok: false, error: 'Not valid JSON' };
    try { JSON.parse(s); return { ok: true }; }
    catch (e: any) { return { ok: false, error: 'Parse error: ' + (e?.message || String(e)) }; }
  }
}

export const jsonGuard = new JsonGuardService();
