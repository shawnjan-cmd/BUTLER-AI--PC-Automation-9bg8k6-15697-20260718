/**
 * 🌐 SIGMA-NET RELAY CRAWLER
 * Server-Integrated Graph-Mapped Autonomous-crawler
 * via Network-Encoded Teleport Relay
 *
 * CONCEPT: Instead of crawling from Android (limited, blocked),
 * we TELEPORT the crawl request through the paired PC server.
 * The PC's Python process does the actual HTTP fetch (unrestricted),
 * applies cleaning, returns compressed clean text back to mobile.
 *
 * Mobile → [SIGMA-NET RELAY] → PC Server → Open Web → Data back
 *
 * Benefits:
 *  ✅ No Android SSL pinning / network policy blocks
 *  ✅ Full desktop browser User-Agent from the PC
 *  ✅ Access to sites that block mobile user agents
 *  ✅ PC can run the dedicated kb_crawler.py for deep crawls
 *  ✅ Unlimited concurrent fetches via Python asyncio
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { serverConnection } from './serverConnection';
import { knowledgeAccumulator, CompressedKnowledge } from './knowledgeAccumulator';
import { performanceGovernor } from './performanceGovernor';

// ── Types ────────────────────────────────────────────────────────
export interface ResearchConsent {
  approved: true;
  approvedAt: number;
  scope: 'research' | 'knowledge' | 'crawler';
  domains?: string[];
}

/** Call only immediately after a visible user approval action. */
export function createResearchConsent(scope: ResearchConsent['scope'] = 'research', domains?: string[]): ResearchConsent {
  return { approved: true, approvedAt: Date.now(), scope, ...(domains?.length ? { domains: domains.slice(0, 20) } : {}) };
}

export interface SigmaRelayRequest {
  url: string;
  domain: string;
  topic: string;
  mode?: 'fetch' | 'deep' | 'multi'; // multi = crawl + follow links
  maxLinks?: number;
  keywords?: string[]; // focus keywords for extraction
  consent?: ResearchConsent; // required for server-side research
}

export interface SigmaRelayResult {
  url: string;
  domain: string;
  topic: string;
  cleanText: string;
  title?: string;
  wordCount: number;
  links?: string[];
  compressed?: CompressedKnowledge;
  error?: string;
  teleportedVia: string; // IP of relay server
  latencyMs: number;
  method: 'SIGMA-NET-RELAY' | 'DIRECT';
}

export interface BatchRelayResult {
  completed: number;
  failed: number;
  results: SigmaRelayResult[];
  totalWords: number;
  totalMs: number;
}

// ── Log callback type ────────────────────────────────────────────
export type RelayLogCallback = (msg: string, type?: 'info' | 'ok' | 'warn' | 'error') => void;

class SigmaNetRelayCrawler {
  private _relayAvailable = false;
  private _relayIp = '';
  private _relayPort = '';

  // ── Check if relay is available ───────────────────────────────
  async checkRelay(): Promise<boolean> {
    await serverConnection.load();
    const ip   = serverConnection.getIP();
    const port = serverConnection.getPort();
    if (!ip || !port) { this._relayAvailable = false; return false; }

    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`http://${ip}:${port}/api/status`, { signal: ctrl.signal });
      if (res.ok) {
        this._relayAvailable = true;
        this._relayIp = ip;
        this._relayPort = port;
        return true;
      }
    } catch {}
    this._relayAvailable = false;
    return false;
  }

  // ── Single URL crawl via SIGMA-NET relay ─────────────────────
  async crawlViaRelay(
    req: SigmaRelayRequest,
    onLog?: RelayLogCallback
  ): Promise<SigmaRelayResult> {
    if (!req.consent?.approved) {
      return {
        url: req.url, domain: req.domain, topic: req.topic, cleanText: '', wordCount: 0,
        error: 'Explicit research consent is required before crawling', teleportedVia: 'BLOCKED',
        latencyMs: 0, method: 'SIGMA-NET-RELAY',
      };
    }
    if (!performanceGovernor.canRunOptional('crawler')) {
      return {
        url: req.url, domain: req.domain, topic: req.topic, cleanText: '', wordCount: 0,
        error: 'Optional crawler work is temporarily paused to protect core functions', teleportedVia: 'PAUSED',
        latencyMs: 0, method: 'SIGMA-NET-RELAY',
      };
    }
    const start = Date.now();
    const log = (msg: string, type: Parameters<RelayLogCallback>[1] = 'info') => onLog?.(msg, type);

    // Ensure relay is available
    if (!this._relayAvailable) {
      const ok = await this.checkRelay();
      if (!ok) {
        log('Server offline — crawl skipped (server handles all fetching)', 'warn');
        return {
          url: req.url, domain: req.domain, topic: req.topic,
          cleanText: '', wordCount: 0, error: 'Server offline — crawl skipped',
          teleportedVia: 'SKIPPED', latencyMs: 0, method: 'SIGMA-NET-RELAY' as any,
        };
      }
    }

    const token = serverConnection.getToken();
    log(`[SIGMA-NET] Teleporting request → ${this._relayIp}:${this._relayPort}`, 'info');
    log(`[RELAY] Fetching: ${req.url}`, 'info');

    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 35000);

      const res = await fetch(
        `http://${this._relayIp}:${this._relayPort}/api/crawl`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            consent: req.consent,
            url: req.url,
            domain: req.domain,
            topic: req.topic,
            mode: req.mode || 'fetch',
            maxLinks: req.maxLinks || 5,
            keywords: req.keywords || [],
          }),
          signal: ctrl.signal,
        }
      );

      const latencyMs = Date.now() - start;

      if (!res.ok) {
        if (res.status === 404) {
          // Never fall back to arbitrary script execution for crawling.
          log('[SIGMA-NET] Dedicated crawl endpoint unavailable; no execute fallback', 'warn');
          return {
            url: req.url, domain: req.domain, topic: req.topic, cleanText: '', wordCount: 0,
            error: 'Dedicated authenticated crawl endpoint unavailable', teleportedVia: 'BLOCKED',
            latencyMs, method: 'SIGMA-NET-RELAY',
          };
        }
        throw new Error(`Relay HTTP ${res.status}`);
      }

      const data = await res.json();
      log(`[RELAY] ✓ Received ${data.wordCount || 0} words in ${latencyMs}ms`, 'ok');

      const result: SigmaRelayResult = {
        url: req.url,
        domain: req.domain,
        topic: req.topic,
        cleanText: data.cleanText || data.text || '',
        title: data.title,
        wordCount: data.wordCount || 0,
        links: data.links || [],
        teleportedVia: `${this._relayIp}:${this._relayPort}`,
        latencyMs,
        method: 'SIGMA-NET-RELAY',
      };

      // Auto-compress and save
      if (result.cleanText.length > 50) {
        result.compressed = knowledgeAccumulator.compressResearch(
          result.cleanText, req.domain, req.topic, req.url
        );
        await knowledgeAccumulator.addFindingDeduped(result.compressed);
        log(`[SIGMA-NET] Compressed + deduplicated + saved to KB`, 'ok');
      }

      return result;

    } catch (err: any) {
      const msg = err?.name === 'AbortError' ? 'Relay timeout (35s)' : err?.message || 'Unknown';
      log(`[SIGMA-NET] Relay failed: ${msg}`, 'warn');
      log('Server offline — crawl skipped (server handles all fetching)', 'warn');
      return {
        url: req.url, domain: req.domain, topic: req.topic,
        cleanText: '', wordCount: 0, error: `Relay failed: ${msg}`,
        teleportedVia: 'SKIPPED', latencyMs: Date.now() - start, method: 'SIGMA-NET-RELAY' as any,
      };
    }
  }

  // ── Batch multi-URL crawl via SIGMA-NET ──────────────────────
  async batchCrawlViaRelay(
    requests: SigmaRelayRequest[],
    onLog?: RelayLogCallback,
    onProgress?: (done: number, total: number) => void,
    consent?: ResearchConsent
  ): Promise<BatchRelayResult> {
    if (!consent?.approved) {
      return {
        completed: 0,
        failed: requests.length,
        results: requests.map(req => ({
          url: req.url, domain: req.domain, topic: req.topic, cleanText: '', wordCount: 0,
          error: 'Explicit research consent is required before crawling', teleportedVia: 'BLOCKED',
          latencyMs: 0, method: 'SIGMA-NET-RELAY',
        })),
        totalWords: 0, totalMs: 0,
      };
    }
    if (!performanceGovernor.canRunOptional('crawler')) {
      return {
        completed: 0,
        failed: requests.length,
        results: requests.map(req => ({
          url: req.url, domain: req.domain, topic: req.topic, cleanText: '', wordCount: 0,
          error: 'Optional crawler work is temporarily paused to protect core functions', teleportedVia: 'PAUSED',
          latencyMs: 0, method: 'SIGMA-NET-RELAY',
        })),
        totalWords: 0, totalMs: 0,
      };
    }
    const log = (msg: string, type: Parameters<RelayLogCallback>[1] = 'info') => onLog?.(msg, type);
    log(`[SIGMA-NET BATCH] Starting ${requests.length} relay crawls`, 'info');

    const results: SigmaRelayResult[] = [];
    let failed = 0;
    let totalWords = 0;
    const batchStart = Date.now();

    // Check if we can use the multi-crawl endpoint
    if (this._relayAvailable) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 60000);
        const token = serverConnection.getToken();

        const res = await fetch(
          `http://${this._relayIp}:${this._relayPort}/api/crawl/batch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ requests, consent }),
            signal: ctrl.signal,
          }
        );

        if (res.ok) {
          const data = await res.json();
          log(`[SIGMA-NET BATCH] ✓ Batch complete: ${data.completed} done, ${data.failed} failed`, 'ok');
          await knowledgeAccumulator.saveNow();
          return data as BatchRelayResult;
        }
      } catch { /* fall through to sequential */ }
    }

    // Sequential fallback
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      log(`[${i + 1}/${requests.length}] Relaying: ${req.url.slice(0, 50)}...`, 'info');
      try {
        const result = await this.crawlViaRelay({ ...req, consent }, onLog);
        results.push(result);
        totalWords += result.wordCount;
        if (result.error) failed++;
        onProgress?.(i + 1, requests.length);
        await new Promise(r => setTimeout(r, 400)); // rate limit
      } catch (e: any) {
        failed++;
        results.push({
          url: req.url, domain: req.domain, topic: req.topic,
          cleanText: '', wordCount: 0, error: e?.message,
          teleportedVia: 'FAILED', latencyMs: 0, method: 'SIGMA-NET-RELAY',
        });
      }
    }

    await knowledgeAccumulator.saveNow();
    log(`[SIGMA-NET BATCH] All done: ${results.length - failed} success, ${failed} fail`, failed > 0 ? 'warn' : 'ok');

    return {
      completed: results.length - failed,
      failed,
      results,
      totalWords,
      totalMs: Date.now() - batchStart,
    };
  }

  // Dedicated server crawling is the only supported path. The client never
  // generates Python fetch scripts or performs a direct internet fallback.

  // ── Getters ───────────────────────────────────────────────────
  isRelayAvailable() { return this._relayAvailable; }
  getRelayAddr()     { return this._relayAvailable ? `${this._relayIp}:${this._relayPort}` : 'NONE'; }
}

export const sigmaNetCrawler = new SigmaNetRelayCrawler();

// ── Python automation crawl targets (for batch relay) ────────────
export const SIGMA_PYTHON_TARGETS: SigmaRelayRequest[] = [
  { url: 'https://docs.python.org/3/library/pathlib.html',    domain: 'Python', topic: 'pathlib',   mode: 'fetch', keywords: ['path', 'file', 'directory'] },
  { url: 'https://docs.python.org/3/library/subprocess.html', domain: 'Python', topic: 'subprocess', mode: 'fetch', keywords: ['process', 'shell', 'command'] },
  { url: 'https://docs.python.org/3/library/os.html',         domain: 'Python', topic: 'os module',  mode: 'fetch', keywords: ['os', 'environment', 'file'] },
  { url: 'https://pypi.org/project/psutil/',                  domain: 'Python', topic: 'psutil',     mode: 'fetch', keywords: ['cpu', 'memory', 'process'] },
  { url: 'https://pypi.org/project/pyautogui/',               domain: 'Python', topic: 'pyautogui',  mode: 'fetch', keywords: ['gui', 'mouse', 'keyboard'] },
  { url: 'https://pypi.org/project/selenium/',                domain: 'Python', topic: 'selenium',   mode: 'fetch', keywords: ['browser', 'web', 'automation'] },
  { url: 'https://pypi.org/project/requests/',                domain: 'Python', topic: 'requests',   mode: 'fetch', keywords: ['http', 'api', 'web'] },
  { url: 'https://pypi.org/project/schedule/',                domain: 'Python', topic: 'schedule',   mode: 'fetch', keywords: ['cron', 'timer', 'interval'] },
  { url: 'https://pypi.org/project/watchdog/',                domain: 'Python', topic: 'watchdog',   mode: 'fetch', keywords: ['file', 'watch', 'event'] },
  { url: 'https://pypi.org/project/pandas/',                  domain: 'Python', topic: 'pandas',     mode: 'fetch', keywords: ['data', 'csv', 'dataframe'] },
  { url: 'https://pypi.org/project/openpyxl/',                domain: 'Python', topic: 'openpyxl',   mode: 'fetch', keywords: ['excel', 'xlsx', 'spreadsheet'] },
  { url: 'https://pypi.org/project/beautifulsoup4/',          domain: 'Python', topic: 'beautifulsoup', mode: 'fetch', keywords: ['html', 'parse', 'scrape'] },
  { url: 'https://docs.python.org/3/library/smtplib.html',   domain: 'Python', topic: 'smtplib',    mode: 'fetch', keywords: ['email', 'smtp', 'mail'] },
  { url: 'https://docs.python.org/3/library/socket.html',    domain: 'Python', topic: 'socket',     mode: 'fetch', keywords: ['network', 'tcp', 'socket'] },
  { url: 'https://pypi.org/project/apscheduler/',             domain: 'Python', topic: 'apscheduler', mode: 'fetch', keywords: ['scheduler', 'cron', 'job'] },
];
