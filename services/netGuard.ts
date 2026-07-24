/**
 * netGuard.ts — the ONLY way app code should talk to the Butler server.
 * Guarantees: timeout via AbortController, single retry with backoff,
 * response size cap, JSON-shape guard, and typed failures.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */

export interface NetResult<T> {
  ok:     boolean;
  status: number;
  data:   T | null;
  error:  'TIMEOUT' | 'OFFLINE' | 'HTTP' | 'BAD_JSON' | 'TOO_LARGE' | null;
}

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function guardedFetch<T = unknown>(
  url:  string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<NetResult<T>> {
  const { timeoutMs = 6000, retries = 1 } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(timer);

      const len = Number(res.headers.get('content-length') || 0);
      if (len > MAX_RESPONSE_BYTES)
        return { ok: false, status: res.status, data: null, error: 'TOO_LARGE' };

      const text = await res.text();
      if (text.length > MAX_RESPONSE_BYTES)
        return { ok: false, status: res.status, data: null, error: 'TOO_LARGE' };

      if (!res.ok)
        return { ok: false, status: res.status, data: null, error: 'HTTP' };

      try {
        return { ok: true, status: res.status, data: JSON.parse(text) as T, error: null };
      } catch {
        return { ok: false, status: res.status, data: null, error: 'BAD_JSON' };
      }
    } catch (e: any) {
      clearTimeout(timer);
      const isAbort = e?.name === 'AbortError';
      if (attempt === retries)
        return { ok: false, status: 0, data: null, error: isAbort ? 'TIMEOUT' : 'OFFLINE' };
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return { ok: false, status: 0, data: null, error: 'OFFLINE' };
}
