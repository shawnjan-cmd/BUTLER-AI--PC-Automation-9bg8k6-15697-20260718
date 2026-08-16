/**
 * 🔍 AUTOMATION WATCHDOG — Butler AI
 *
 * Automatically detects when an automation or script is causing problems:
 *  - File system errors (permission denied, missing files, disk full)
 *  - Destructive operations (mass deletions, unexpected writes)
 *  - Script crashes (unhandled exceptions, non-zero exit codes)
 *  - Repeated consecutive failures from the same automation
 *
 * Runs silently after every execution. Fires an Alert when something
 * looks wrong so the user is never blindsided by a broken automation.
 *
 * Enabled by default. Toggle via AsyncStorage key WATCHDOG_ENABLED_KEY.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// ── Storage keys ──────────────────────────────────────────────────────────────
const WATCHDOG_ENABLED_KEY = '@butler_watchdog_enabled_v1';
const INCIDENT_LOG_KEY     = '@butler_watchdog_incidents_v1';
const MAX_INCIDENTS        = 50;

// How many consecutive failures before the watchdog raises an alert
const CONSECUTIVE_FAIL_THRESHOLD = 3;

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncidentSeverity = 'info' | 'warning' | 'critical';

export interface WatchdogIncident {
  id:           string;
  ts:           number;
  automationId: string;   // e.g. 'morning_report', 'disk_guardian', 'user_script'
  automationName: string; // human label
  severity:     IncidentSeverity;
  category:     string;   // 'file_error' | 'crash' | 'repeated_failure' | 'destructive_op'
  title:        string;
  detail:       string;   // first 300 chars of matching output
  alerted:      boolean;  // was the user shown an Alert?
}

// ── Problem pattern definitions ───────────────────────────────────────────────

interface ProblemPattern {
  id:       string;
  category: string;
  severity: IncidentSeverity;
  title:    string;
  regex:    RegExp;
  detail:   (match: RegExpMatchArray, full?: string) => string;
}

const PROBLEM_PATTERNS: ProblemPattern[] = [
  // ── File permission errors ─────────────────────────────
  {
    id: 'PERMISSION_DENIED',
    category: 'file_error',
    severity: 'critical',
    title: 'File Permission Denied',
    regex: /PermissionError.*\[Errno 13\]|Access is denied|WinError 5|Permission denied/i,
    detail: m => `Permission denied while accessing a file or directory. The automation may not have rights to read or write a file.\n\nOutput: "${m[0].slice(0, 200)}"`,
  },
  {
    id: 'FILE_NOT_FOUND',
    category: 'file_error',
    severity: 'warning',
    title: 'File or Folder Not Found',
    regex: /FileNotFoundError.*\[Errno 2\]|No such file or directory|WinError 2\b/i,
    detail: m => `A file or folder the automation expected to find is missing. It may have been moved, renamed, or deleted.\n\nOutput: "${m[0].slice(0, 200)}"`,
  },
  {
    id: 'DISK_FULL',
    category: 'file_error',
    severity: 'critical',
    title: 'Disk Full',
    regex: /OSError.*\[Errno 28\]|No space left on device|WinError 112|disk full|not enough space/i,
    detail: m => `The disk ran out of space during the automation. Files may be incomplete or corrupted.\n\nOutput: "${m[0].slice(0, 200)}"`,
  },
  {
    id: 'FILE_IN_USE',
    category: 'file_error',
    severity: 'warning',
    title: 'File In Use / Locked',
    regex: /WinError 32|The process cannot access the file|being used by another process/i,
    detail: m => `A file the automation tried to modify is locked by another program.\n\nOutput: "${m[0].slice(0, 200)}"`,
  },
  // ── Destructive operations ─────────────────────────────
  {
    id: 'MASS_DELETION',
    category: 'destructive_op',
    severity: 'warning',
    title: 'Mass File Deletion Detected',
    // Matches output that mentions deleting/removing multiple files
    regex: /deleted \d{2,} files?|removed \d{2,} files?|(\d{2,}) files? (deleted|removed)/i,
    detail: m => `The automation reported deleting a large number of files (${m[0]}). Check that this was intentional and no important data was lost.`,
  },
  {
    id: 'OS_ERROR',
    category: 'file_error',
    severity: 'warning',
    title: 'OS File System Error',
    regex: /OSError:|IOError:|IsADirectoryError:|NotADirectoryError:|FileExistsError:/,
    detail: m => `An operating-system level file error occurred during automation.\n\nOutput: "${m[0].slice(0, 200)}"`,
  },
  // ── Script crash / exception ───────────────────────────
  {
    id: 'UNHANDLED_EXCEPTION',
    category: 'crash',
    severity: 'warning',
    title: 'Automation Crashed (Unhandled Exception)',
    regex: /Traceback \(most recent call last\)/,
    detail: (_: RegExpMatchArray, full?: string) => {
      // Extract the last line of the traceback for a concise message
      const lines = (full ?? '').split('\n').filter((l: string) => l.trim());
      const last = lines[lines.length - 1] || '';
      return `The automation script threw an unhandled exception and did not finish.\n\nLast error: "${last.slice(0, 200)}"`;
    },
  },
];

// ── Failure tracker (per automationId) ───────────────────────────────────────

interface FailureState {
  consecutiveFails: number;
  lastAlertedAt:    number;   // epoch ms — to avoid repeat alert spam
}

// ── Main watchdog class ───────────────────────────────────────────────────────

class AutomationWatchdogService {
  private _enabled = true;
  private _loaded  = false;
  private _incidents: WatchdogIncident[] = [];
  private _failureStates: Map<string, FailureState> = new Map();
  private _listeners: Set<(incidents: WatchdogIncident[]) => void> = new Set();

  // ── Subscriptions ─────────────────────────────────────────────────
  subscribe(fn: (incidents: WatchdogIncident[]) => void): () => void {
    this._listeners.add(fn);
    fn([...this._incidents]);
    return () => this._listeners.delete(fn);
  }

  private _emit(): void {
    const snap = [...this._incidents];
    this._listeners.forEach(fn => { try { fn(snap); } catch {} });
  }

  // ── Init / load ───────────────────────────────────────────────────
  async load(): Promise<void> {
    if (this._loaded) return;
    try {
      const [enabledRaw, logRaw] = await Promise.all([
        AsyncStorage.getItem(WATCHDOG_ENABLED_KEY),
        AsyncStorage.getItem(INCIDENT_LOG_KEY),
      ]);
      this._enabled = enabledRaw !== '0';
      if (logRaw) this._incidents = JSON.parse(logRaw);
    } catch {}
    this._loaded = true;
  }

  async setEnabled(v: boolean): Promise<void> {
    // Mark as loaded so a concurrent load() call does not overwrite this choice
    // with a stale value from storage before the setItem write completes.
    this._loaded = true;
    this._enabled = v;
    try {
      await AsyncStorage.setItem(WATCHDOG_ENABLED_KEY, v ? '1' : '0');
    } catch {}
  }

  isEnabled(): boolean { return this._enabled; }

  // ── Main entry point ──────────────────────────────────────────────
  /**
   * Call after every automation or script execution.
   *
   * @param automationId    Short identifier, e.g. 'morning_report', 'disk_guardian', 'user_script'
   * @param automationName  Human-readable label shown in alerts
   * @param output          Combined stdout / stderr from the execution
   * @param success         Whether the script reported success (exit code 0)
   */
  async report(
    automationId:   string,
    automationName: string,
    output:         string,
    success:        boolean,
  ): Promise<void> {
    await this.load();
    if (!this._enabled) return;

    const incidents: WatchdogIncident[] = [];

    // ── 1. Scan output for problem patterns ───────────────────────
    for (const pattern of PROBLEM_PATTERNS) {
      const match = output.match(pattern.regex);
      if (!match) continue;

      const detail = pattern.detail(match, output);
      incidents.push(this._makeIncident(
        automationId, automationName,
        pattern.severity, pattern.category,
        pattern.title, detail,
      ));
    }

    // ── 2. Track consecutive failures ────────────────────────────
    if (!success && incidents.length === 0) {
      // Generic failure with no recognised pattern — still count it
      const state = this._getFailureState(automationId);
      state.consecutiveFails++;

      if (state.consecutiveFails >= CONSECUTIVE_FAIL_THRESHOLD) {
        // Don't spam: only alert once per 10 minutes for the same automation
        const now = Date.now();
        if (now - state.lastAlertedAt > 10 * 60_000) {
          state.lastAlertedAt = now;
          incidents.push(this._makeIncident(
            automationId, automationName,
            'warning', 'repeated_failure',
            'Automation Failing Repeatedly',
            `"${automationName}" has failed ${state.consecutiveFails} times in a row without a recognisable error pattern. Something may be wrong with the automation or the PC environment.`,
          ));
        }
      }
    } else if (success) {
      // Reset consecutive failure count on success
      const state = this._getFailureState(automationId);
      state.consecutiveFails = 0;
    }

    if (incidents.length === 0) return;

    // ── 3. Persist and alert ──────────────────────────────────────
    for (const incident of incidents) {
      this._incidents.unshift(incident);
    }
    if (this._incidents.length > MAX_INCIDENTS) {
      this._incidents.length = MAX_INCIDENTS;
    }

    await this._persist();
    this._emit();

    // Show one alert for the worst incident
    const worstIncident = incidents.reduce((prev, cur) => {
      const rank: Record<IncidentSeverity, number> = { info: 0, warning: 1, critical: 2 };
      return rank[cur.severity] >= rank[prev.severity] ? cur : prev;
    });

    this._showAlert(worstIncident, automationName);
  }

  // ── Incident accessors ────────────────────────────────────────────
  getIncidents(): WatchdogIncident[] {
    return [...this._incidents];
  }

  async clearIncidents(): Promise<void> {
    this._incidents = [];
    this._failureStates.clear();
    try { await AsyncStorage.removeItem(INCIDENT_LOG_KEY); } catch {}
    this._emit();
  }

  // ── Internals ─────────────────────────────────────────────────────
  private _makeIncident(
    automationId:   string,
    automationName: string,
    severity:       IncidentSeverity,
    category:       string,
    title:          string,
    detail:         string,
  ): WatchdogIncident {
    return {
      id:           `wdg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ts:           Date.now(),
      automationId,
      automationName,
      severity,
      category,
      title,
      detail: detail.slice(0, 300),
      alerted: false,
    };
  }

  private _getFailureState(automationId: string): FailureState {
    if (!this._failureStates.has(automationId)) {
      this._failureStates.set(automationId, { consecutiveFails: 0, lastAlertedAt: 0 });
    }
    return this._failureStates.get(automationId)!;
  }

  private _showAlert(incident: WatchdogIncident, automationName: string): void {
    const icon = incident.severity === 'critical' ? '🚨' : '⚠️';
    incident.alerted = true;

    Alert.alert(
      `${icon} Automation Problem Detected`,
      `Automation: "${automationName}"\n\n${incident.title}\n\n${incident.detail}`,
      [
        { text: 'Dismiss', style: 'cancel' },
        {
          text: 'View Log',
          onPress: () => {
            // Log to console for now — the Logs tab will pick this up
            console.warn(
              `[AutomationWatchdog] ${incident.severity.toUpperCase()} — ${incident.automationName}: ${incident.title}\n${incident.detail}`,
            );
          },
        },
      ],
    );
  }

  private async _persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(INCIDENT_LOG_KEY, JSON.stringify(this._incidents.slice(0, MAX_INCIDENTS)));
    } catch {}
  }
}

export const automationWatchdog = new AutomationWatchdogService();
