/**
 * otaUpdates — privacy-first update status contract.
 *
 * Silent update checks create unexpected external network traffic. Production
 * Butler AI releases therefore use the store-delivered binary as the update
 * channel and expose no GitHub polling or runtime OTA fetch path.
 */
export interface RepoRef { owner: string; repo: string; branch: string }
export interface UpdateInfo {
  available: boolean;
  source: 'expo' | 'github' | 'none';
  sha?: string;
  short?: string;
  message?: string;
  author?: string;
  date?: string;
  checking: boolean;
  applying: boolean;
  error?: string;
  lastCheck: number;
}

let state: UpdateInfo = { available: false, source: 'none', checking: false, applying: false, lastCheck: 0 };
const listeners = new Set<(s: UpdateInfo) => void>();

const DISABLED_MESSAGE = 'Automatic update checks are disabled for privacy. Install verified releases through the app store.';

function emit(patch: Partial<UpdateInfo>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => { try { l(state); } catch {} });
}

export const otaUpdates = {
  getState(): UpdateInfo { return state; },

  subscribe(fn: (s: UpdateInfo) => void): () => void {
    listeners.add(fn);
    try { fn(state); } catch {}
    return () => { listeners.delete(fn); };
  },

  async getRepo(): Promise<RepoRef> {
    return { owner: '', repo: '', branch: '' };
  },

  async setRepo(_ref: Partial<RepoRef>): Promise<void> {
    emit({ available: false, source: 'none', sha: undefined, short: undefined, error: undefined });
  },

  async isAuto(): Promise<boolean> {
    return false;
  },
  async setAuto(_on: boolean): Promise<void> {
    emit({ available: false, source: 'none' });
  },

  /** No network request is made by this method. */
  async check(silent = true): Promise<UpdateInfo> {
    emit({ checking: false, applying: false, available: false, source: 'none', lastCheck: Date.now(), error: silent ? undefined : DISABLED_MESSAGE });
    return state;
  },

  /** Store-distributed releases are intentionally the only installation channel. */
  async apply(): Promise<boolean> {
    emit({ applying: false, available: false, source: 'none', error: DISABLED_MESSAGE });
    return false;
  },

  /** Kept as a no-op compatibility surface for existing UI. */
  async dismiss(): Promise<void> {
    emit({ available: false, source: 'none' });
  },

  /** No-op by design: the privacy baseline never schedules update polling. */
  start(): () => void {
    return () => {};
  },
};

export default otaUpdates;
