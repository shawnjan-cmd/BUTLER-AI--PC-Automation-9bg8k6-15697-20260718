import { getItem, removeItem, setItem } from './storage';

export type ServerConfig = {
  host: string;
  port: string;
  token: string;
  useHttps: boolean;
};

export type ConnectionCheck = {
  ok: boolean;
  status: number | null;
  latencyMs: number | null;
  endpoint: string | null;
  error?: string;
};

const KEY = 'butler.server.config.v1';

export const DEFAULT_CONFIG: ServerConfig = {
  host: '',
  port: '11434',
  token: '',
  useHttps: false,
};

function normalizeHost(host: string): string {
  return host.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export async function loadConfig(): Promise<ServerConfig> {
  const stored = await getItem<Partial<ServerConfig>>(KEY);
  return {
    ...DEFAULT_CONFIG,
    ...(stored ?? {}),
    host: normalizeHost(String(stored?.host ?? DEFAULT_CONFIG.host)),
    port: String(stored?.port ?? DEFAULT_CONFIG.port).trim(),
    token: String(stored?.token ?? DEFAULT_CONFIG.token).trim(),
    useHttps: Boolean(stored?.useHttps ?? DEFAULT_CONFIG.useHttps),
  };
}

export async function saveConfig(cfg: ServerConfig): Promise<void> {
  const payload: ServerConfig = {
    host: normalizeHost(cfg.host),
    port: String(cfg.port ?? '').trim() || DEFAULT_CONFIG.port,
    token: String(cfg.token ?? '').trim(),
    useHttps: Boolean(cfg.useHttps),
  };
  await setItem(KEY, payload);
}

export async function clearConfig(): Promise<void> {
  await removeItem(KEY);
}

export function buildBaseUrl(cfg: ServerConfig): string {
  const host = normalizeHost(cfg.host);
  if (!host) return '';

  const scheme = cfg.useHttps ? 'https' : 'http';
  const port = String(cfg.port ?? '').trim();

  return port ? `${scheme}://${host}:${port}` : `${scheme}://${host}`;
}

function mergeHeaders(cfg: ServerConfig, init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (cfg.token && !headers.has('Authorization')) {
    headers.set('Authorization', 'Bearer ' + cfg.token);
  }
  return headers;
}

export async function fetchWithAuth(
  cfg: ServerConfig,
  path: string,
  init: RequestInit = {},
  timeoutMs = 20_000,
): Promise<Response> {
  const base = buildBaseUrl(cfg);
  if (!base) throw new Error('Server is not configured yet. Set host and port first.');

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (init.signal) {
    init.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, {
      ...init,
      headers: mergeHeaders(cfg, init),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw new Error('Request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function quickProbe(cfg: ServerConfig, endpoint: string): Promise<ConnectionCheck> {
  const startedAt = Date.now();
  try {
    const response = await fetchWithAuth(cfg, endpoint, { method: 'GET' }, 8_000);
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      endpoint,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - startedAt,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}

export async function testServerConnection(cfg: ServerConfig): Promise<ConnectionCheck> {
  const probes = ['/api/tags', '/health', '/api/status'];

  let lastFailure: ConnectionCheck = {
    ok: false,
    status: null,
    latencyMs: null,
    endpoint: null,
    error: 'Unable to reach server',
  };

  for (const endpoint of probes) {
    const result = await quickProbe(cfg, endpoint);
    if (result.ok) return result;
    lastFailure = result;
  }

  return lastFailure;
}

export async function pingServer(cfg: ServerConfig): Promise<boolean> {
  const result = await testServerConnection(cfg);
  return result.ok;
}
