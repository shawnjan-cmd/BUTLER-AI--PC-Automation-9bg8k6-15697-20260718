import AsyncStorage from '@react-native-async-storage/async-storage';

export type DesignCatalog = {
  schema: 'butler.design-catalog.v1';
  catalogVersion?: string;
  source?: 'paired-local-server' | 'bundled';
  assetsAreExecutable: false;
  allowedMimeTypes: string[];
  maxAssetBytes: number;
  styles: Array<{ id: string; creature: string; accent: string }>;
  categories: string[];
  assetPolicy: { localOnly: true; requireSha256: true; rejectScripts: true; rejectArchives: true; rejectUnknownMime: true; cacheDirectory: string; fallback: 'bundled-token-renderer' };
};

const CACHE_KEY = '@butler_design_catalog_v1';
const MAX_CATALOG_BYTES = 256 * 1024;
const BUNDLED_FALLBACK: DesignCatalog = { schema: 'butler.design-catalog.v1', source: 'bundled', assetsAreExecutable: false, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/json'], maxAssetBytes: 5 * 1024 * 1024, styles: [], categories: [], assetPolicy: { localOnly: true, requireSha256: true, rejectScripts: true, rejectArchives: true, rejectUnknownMime: true, cacheDirectory: 'butler_design_cache', fallback: 'bundled-token-renderer' } };

function validCatalog(value: unknown): value is DesignCatalog {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<DesignCatalog>;
  return c.schema === 'butler.design-catalog.v1' && c.assetsAreExecutable === false && Array.isArray(c.styles) && Array.isArray(c.categories) && !!c.assetPolicy && c.assetPolicy.localOnly === true && c.assetPolicy.rejectScripts === true && Number(c.maxAssetBytes) > 0 && Number(c.maxAssetBytes) <= 10 * 1024 * 1024;
}

async function readCache(): Promise<DesignCatalog | null> { try { const raw = await AsyncStorage.getItem(CACHE_KEY); if (!raw || raw.length > MAX_CATALOG_BYTES) return null; const parsed = JSON.parse(raw); return validCatalog(parsed) ? { ...parsed, source: 'paired-local-server' } : null; } catch { return null; } }

export async function loadDesignCatalog(baseUrl: string, headers: Record<string, string> = {}): Promise<{ catalog: DesignCatalog; fromCache: boolean; fallback: boolean }> {
  const cached = await readCache();
  if (!baseUrl) return { catalog: cached ?? BUNDLED_FALLBACK, fromCache: !!cached, fallback: !cached };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/design-catalog`, { headers, signal: controller.signal });
    clearTimeout(timeout);
    const text = await response.text();
    if (!response.ok || text.length > MAX_CATALOG_BYTES) throw new Error('design catalog unavailable');
    const parsed = JSON.parse(text)?.catalog;
    if (!validCatalog(parsed)) throw new Error('design catalog failed policy validation');
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    return { catalog: { ...parsed, source: 'paired-local-server' }, fromCache: false, fallback: false };
  } catch {
    return { catalog: cached ?? BUNDLED_FALLBACK, fromCache: !!cached, fallback: !cached };
  }
}

export function isAllowedDesignAsset(mime: string, sizeBytes: number, catalog: DesignCatalog): boolean { return catalog.allowedMimeTypes.includes(mime) && sizeBytes >= 0 && sizeBytes <= catalog.maxAssetBytes && !/javascript|zip|executable|shell/i.test(mime); }
