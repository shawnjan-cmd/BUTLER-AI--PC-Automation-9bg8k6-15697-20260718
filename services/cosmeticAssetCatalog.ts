import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@butler_cosmetic_asset_catalog_v1';
const MAX_ENTRIES = 48;

export type CosmeticAssetCategory = 'MASCOT' | 'HEADER' | 'MEDIA' | 'ICON' | 'GRAPH' | 'STYLE';

export type CosmeticCatalogAsset = {
  id: string;
  displayName: string;
  uri: string;
  mimeType: string;
  byteSize?: number;
  category: CosmeticAssetCategory;
  tags: string[];
  provenance: 'LOCAL_USER_SELECTION';
  reviewState: 'READY_FOR_REVIEW';
  addedAt: string;
};

export type CosmeticCatalogCandidate = {
  name?: string | null;
  uri: string;
  mimeType?: string | null;
  size?: number | null;
};

const extensionFrom = (name: string, mimeType: string) => {
  const explicit = name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (explicit && explicit.length <= 6) return explicit;
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('svg')) return 'svg';
  if (mimeType.includes('webp')) return 'webp';
  return 'asset';
};

const titleFrom = (name: string) => name
  .replace(/\.[^/.]+$/, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase()
  .slice(0, 48) || 'UNTITLED ASSET';

export const categorizeCosmeticAsset = (name: string, mimeType: string): CosmeticAssetCategory => {
  const haystack = `${name} ${mimeType}`.toLowerCase();
  if (/mascot|butler|robot|dragon|guardian|character/.test(haystack)) return 'MASCOT';
  if (/header|hero|banner|cover|masthead/.test(haystack)) return 'HEADER';
  if (/icon|glyph|logo|mark|badge/.test(haystack)) return 'ICON';
  if (/graph|chart|metric|spark|gauge|radar/.test(haystack)) return 'GRAPH';
  if (/theme|skin|palette|style|texture|background/.test(haystack)) return 'STYLE';
  return 'MEDIA';
};

export const catalogTagsFor = (category: CosmeticAssetCategory, extension: string) => [
  'BUTLER PROJECT ASSET',
  'LOCAL ONLY',
  'PROPRIETARY REVIEW',
  category,
  extension.toUpperCase(),
];

export async function loadCosmeticAssetCatalog(): Promise<CosmeticCatalogAsset[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is CosmeticCatalogAsset => Boolean(entry?.id && entry?.uri && entry?.displayName));
  } catch {
    return [];
  }
}

async function persist(entries: CosmeticCatalogAsset[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export async function catalogCosmeticAsset(candidate: CosmeticCatalogCandidate): Promise<CosmeticCatalogAsset> {
  const sourceName = candidate.name?.trim() || 'butler-local-asset';
  const mimeType = candidate.mimeType || 'application/octet-stream';
  const extension = extensionFrom(sourceName, mimeType);
  const category = categorizeCosmeticAsset(sourceName, mimeType);
  const addedAt = new Date().toISOString();
  const displayName = `${titleFrom(sourceName)} · ${category}`;
  const entry: CosmeticCatalogAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    displayName,
    uri: candidate.uri,
    mimeType,
    byteSize: typeof candidate.size === 'number' ? candidate.size : undefined,
    category,
    tags: catalogTagsFor(category, extension),
    provenance: 'LOCAL_USER_SELECTION',
    reviewState: 'READY_FOR_REVIEW',
    addedAt,
  };
  const previous = await loadCosmeticAssetCatalog();
  await persist([entry, ...previous.filter(item => item.uri !== entry.uri)]);
  return entry;
}

export async function removeCosmeticAsset(id: string) {
  const previous = await loadCosmeticAssetCatalog();
  await persist(previous.filter(entry => entry.id !== id));
}
