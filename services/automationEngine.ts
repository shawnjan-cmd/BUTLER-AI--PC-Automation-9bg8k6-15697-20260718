/**
 * 🤖 AUTOMATION ENGINE — Butler AI
 *
 * Fires on every successful PC connect and runs configured automations:
 *  1. Morning Report — system info + disk check on first connect each day
 *  2. Disk Guardian  — alert when any partition exceeds the threshold %
 *
 * All settings are persisted in AsyncStorage. Defaults:
 *  morningReport  = true
 *  diskGuardian   = true
 *  diskThreshold  = 85
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { automationWatchdog } from './automationWatchdog';

// ── Storage keys ─────────────────────────────────────────────────────────────
const KEYS = {
  MORNING_REPORT:   '@butler_auto_morning_report_v1',
  DISK_GUARDIAN:    '@butler_disk_guardian_v1',
  DISK_THRESHOLD:   '@butler_disk_threshold_v1',
  LAST_MORNING_RUN: '@butler_last_morning_run_v1',
} as const;

const DEFAULT_THRESHOLD = 85;

// Disk Guardian cooldown: run at most once per hour per session.
// Without this guard, every reconnect (phone sleep/wake, IP change, etc.)
// would fire a disk-check script and show an alert — wasteful and annoying.
const DISK_GUARDIAN_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// ── Types ────────────────────────────────────────────────────────────────────
export interface AutomationSettings {
  morningReport:  boolean;
  diskGuardian:   boolean;
  diskThreshold:  number;  // 0–100 %
}

// ── Python scripts ────────────────────────────────────────────────────────────

/** Full morning system summary — runs on first connect each calendar day */
const MORNING_REPORT_SCRIPT = [
  'import platform, psutil, datetime',
  'now = datetime.datetime.now()',
  'bt  = datetime.datetime.fromtimestamp(psutil.boot_time())',
  'up  = now - bt',
  'vm  = psutil.virtual_memory()',
  'cpu = psutil.cpu_percent(interval=1)',
  'print(f"=== BUTLER MORNING REPORT  {now.strftime(chr(37)+chr(89)+chr(45)+chr(37)+chr(109)+chr(45)+chr(37)+chr(100)+chr(32)+chr(37)+chr(72)+chr(58)+chr(37)+chr(77))}")',
  'print(f"OS      : {platform.system()} {platform.release()}")',
  'print(f"CPU     : {cpu:.1f}%   RAM: {vm.percent:.0f}%  ({vm.used//1024**3}GB / {vm.total//1024**3}GB)")',
  'print(f"Uptime  : {str(up).split(chr(46))[0]}")',
  'print("Disks   :")',
  'for p in psutil.disk_partitions():',
  '    try:',
  '        u = psutil.disk_usage(p.mountpoint)',
  '        bar = chr(9608)*int(u.percent/10) + chr(9617)*(10-int(u.percent/10))',
  '        print(f"  {p.mountpoint:6s} [{bar}] {u.percent:.0f}%  {u.free//1024**3}GB free")',
  '    except: pass',
].join('\n');

/** Lightweight disk check — only reports partitions, used by disk guardian */
const DISK_CHECK_SCRIPT = [
  'import psutil',
  'for p in psutil.disk_partitions():',
  '    try:',
  '        u = psutil.disk_usage(p.mountpoint)',
  '        print(f"{p.mountpoint}|{u.percent:.0f}")',
  '    except: pass',
].join('\n');

// ── Engine ────────────────────────────────────────────────────────────────────

class AutomationEngine {
  private _busyMorning = false;
  private _busyDisk    = false;
  // In-memory timestamp of last disk guardian run — prevents script spam on repeated reconnects.
  private _lastDiskCheckAt = 0;

  // ── Settings ──────────────────────────────────────────────────────────────

  async getSettings(): Promise<AutomationSettings> {
    try {
      const [mr, dg, dt] = await Promise.all([
        AsyncStorage.getItem(KEYS.MORNING_REPORT),
        AsyncStorage.getItem(KEYS.DISK_GUARDIAN),
        AsyncStorage.getItem(KEYS.DISK_THRESHOLD),
      ]);
      return {
        morningReport: mr !== '0',            // default ON
        diskGuardian:  dg !== '0',            // default ON
        diskThreshold: dt ? parseInt(dt, 10) : DEFAULT_THRESHOLD,
      };
    } catch {
      return { morningReport: true, diskGuardian: true, diskThreshold: DEFAULT_THRESHOLD };
    }
  }

  async setSetting(key: keyof AutomationSettings, value: boolean | number): Promise<void> {
    const map: Record<keyof AutomationSettings, string> = {
      morningReport: KEYS.MORNING_REPORT,
      diskGuardian:  KEYS.DISK_GUARDIAN,
      diskThreshold: KEYS.DISK_THRESHOLD,
    };
    const stored = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
    await AsyncStorage.setItem(map[key], stored);
  }

  // ── On-connect hook ───────────────────────────────────────────────────────

  /**
   * Call this right after a successful PC connection.
   * @param execute  Function that sends a Python script to the server and returns stdout.
   */
  async onConnect(execute: (code: string) => Promise<string>): Promise<void> {
    const settings = await this.getSettings();

    if (settings.morningReport) {
      // Fire morning report without awaiting — it's background work
      this._runMorningReport(execute).catch(() => {});
    }

    if (settings.diskGuardian) {
      this._runDiskGuardian(execute, settings.diskThreshold).catch(() => {});
    }
  }

  // ── Morning report ────────────────────────────────────────────────────────

  private async _runMorningReport(execute: (code: string) => Promise<string>): Promise<void> {
    if (this._busyMorning) return;
    try {
      const today = new Date().toDateString();
      const lastRun = await AsyncStorage.getItem(KEYS.LAST_MORNING_RUN);
      if (lastRun === today) return; // already ran today

      this._busyMorning = true;
      await AsyncStorage.setItem(KEYS.LAST_MORNING_RUN, today);

      const report = await execute(MORNING_REPORT_SCRIPT);
      if (report?.trim()) {
        console.log('[AutomationEngine] 🌅 Morning report:\n' + report);
        automationWatchdog.report('morning_report', 'Morning PC Report', report, true).catch(() => {});
      }
    } catch {
      // silent — never interrupt the user over a background task
      automationWatchdog.report('morning_report', 'Morning PC Report', 'Morning report failed to run', false).catch(() => {});
    } finally {
      this._busyMorning = false;
    }
  }

  // ── Disk guardian ─────────────────────────────────────────────────────────

  private async _runDiskGuardian(
    execute: (code: string) => Promise<string>,
    threshold: number,
  ): Promise<void> {
    if (this._busyDisk) return;
    // Cooldown: skip if we already ran within the last hour.
    // This prevents a rapid-reconnect loop (phone sleep/wake, IP change)
    // from firing the disk script and alert on every reconnect.
    const now = Date.now();
    if (now - this._lastDiskCheckAt < DISK_GUARDIAN_COOLDOWN_MS) return;
    try {
      this._busyDisk = true;
      this._lastDiskCheckAt = now;
      const result = await execute(DISK_CHECK_SCRIPT);
      if (!result?.trim()) return;

      // Pass disk output through the watchdog for anomaly detection
      automationWatchdog.report('disk_guardian', 'Disk Space Guardian', result, true).catch(() => {});

      // Each line: "mountpoint|percent" (e.g. "C:|87")
      for (const line of result.split('\n')) {
        const parts = line.trim().split('|');
        if (parts.length !== 2) continue;
        const pct = parseInt(parts[1], 10);
        if (!isNaN(pct) && pct >= threshold) {
          Alert.alert(
            '⚠️ Disk Space Alert',
            `Drive ${parts[0]} is ${pct}% full (threshold: ${threshold}%).\n\nRun "Clean Temps" or "Organize Downloads" from the Scripts tab to free up space.`,
            [{ text: 'OK' }],
          );
          break; // alert once per connect, for the worst drive
        }
      }
    } catch {
      // silent
    } finally {
      this._busyDisk = false;
    }
  }

  // ── Manual trigger helpers (for testing from Settings) ────────────────────

  async triggerMorningReport(execute: (code: string) => Promise<string>): Promise<string> {
    try {
      // Clear last-run date so it runs regardless
      await AsyncStorage.removeItem(KEYS.LAST_MORNING_RUN);
      this._busyMorning = false;
      const result = await execute(MORNING_REPORT_SCRIPT);
      return result || 'No output.';
    } catch (e: any) {
      return `Error: ${e?.message ?? e}`;
    }
  }
}

export const automationEngine = new AutomationEngine();
