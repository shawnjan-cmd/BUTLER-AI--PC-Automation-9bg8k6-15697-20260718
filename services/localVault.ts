import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { encryptedStorage } from '@/services/encryptedStorage';
import { assertImmutablePolicyIntact } from '@/services/immutableSafetyPolicy';

const INDEX_KEY = '@butler_vault_index_v1';
const ROOT = `${FileSystem.documentDirectory ?? ''}butler-vault/`;
const MAX_BYTES = 10 * 1024 * 1024;

export type VaultEntry = {
  id: string;
  name: string;
  mimeType: string;
  byteLength: number;
  digest: string;
  createdAt: string;
};

async function ensureRoot(): Promise<void> {
  if (!ROOT) throw new Error('VAULT_DOCUMENT_DIRECTORY_UNAVAILABLE');
  const info = await FileSystem.getInfoAsync(ROOT);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
}

async function loadIndex(): Promise<VaultEntry[]> {
  const raw = await encryptedStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { throw new Error('VAULT_INDEX_CORRUPT'); }
}

async function saveIndex(entries: VaultEntry[]): Promise<void> {
  await encryptedStorage.setItem(INDEX_KEY, JSON.stringify(entries.slice(-200)));
}

export async function listVaultEntries(): Promise<VaultEntry[]> {
  assertImmutablePolicyIntact();
  return loadIndex();
}

export async function importToVault(): Promise<VaultEntry | null> {
  assertImmutablePolicyIntact();
  const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const asset = picked.assets[0];
  if (typeof asset.size === 'number' && asset.size > MAX_BYTES) throw new Error('VAULT_FILE_TOO_LARGE');
  await ensureRoot();
  const source = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  if (source.length > Math.ceil(MAX_BYTES * 1.4)) throw new Error('VAULT_FILE_TOO_LARGE');
  const id = Crypto.randomUUID();
  const sealed = await encryptedStorage.encryptBlobText(source);
  const target = `${ROOT}${id}.butlersealed`;
  await FileSystem.writeAsStringAsync(target, sealed, { encoding: FileSystem.EncodingType.UTF8 });
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, source);
  const entry: VaultEntry = { id, name: asset.name || 'untitled', mimeType: asset.mimeType || 'application/octet-stream', byteLength: asset.size || 0, digest, createdAt: new Date().toISOString() };
  await saveIndex([...(await loadIndex()), entry]);
  return entry;
}

export async function removeVaultEntry(id: string): Promise<void> {
  assertImmutablePolicyIntact();
  await ensureRoot();
  const target = `${ROOT}${id}.butlersealed`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await saveIndex((await loadIndex()).filter(entry => entry.id !== id));
}

export async function readVaultBase64(id: string): Promise<string> {
  assertImmutablePolicyIntact();
  await ensureRoot();
  const sealed = await FileSystem.readAsStringAsync(`${ROOT}${id}.butlersealed`, { encoding: FileSystem.EncodingType.UTF8 });
  return encryptedStorage.decryptBlobText(sealed);
}
