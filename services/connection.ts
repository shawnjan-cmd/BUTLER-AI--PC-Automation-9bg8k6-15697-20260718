import { getItem, setItem } from './storage';

export type ServerConfig = {
  host: string;
  port: string;
  token: string;
  useHttps: boolean;
};

const KEY = 'butler.server.config.v1';

export const DEFAULT_CONFIG: ServerConfig = {
  host: '',
  port: '11434',
  token: '',
  useHttps: false,
};

export async function loadConfig(): Promise<ServerConfig> {
  const stored = await getItem<Partial<ServerConfig>>(KEY);
  return { ...DEFAULT_CONFIG, ...(stored ?? {}) };
}

export async function saveConfig(cfg: ServerConfig): Promise<void> {
  await setItem(KEY, cfg);
}

export function buildBaseUrl(cfg: ServerConfig): string {
  const scheme = cfg.useHttps ? 'https' : 'http';
  const host = cfg.host.trim();
  const port = String(cfg.port ?? '').trim();
  if (!host) return '';
  return port ? `${scheme}://${host}:${port}` : `${scheme}://${host}`;
}

export async function fetchWithAuth(
  cfg: ServerConfig,
  path: string,
  init: RequestInit = {},
  timeoutMs = 120_000,
): Promise<Response> {
  const base = buildBaseUrl(cfg);
  if (!base) throw new Error('Server not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

  try {
    return await fetch(`${base}${path}`, { ...init, headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function pingServer(cfg: ServerConfig): Promise<boolean> {
  try {
    const res = await fetchWithAuth(cfg, '/api/tags', { method: 'GET' }, 5_000);
    return res.ok;
  } catch {
    return false;
  }
}
