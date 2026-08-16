import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptedStorage } from '@/services/encryptedStorage';
import { assertImmutablePolicyIntact } from '@/services/immutableSafetyPolicy';

const CHECK_KEYS = ['@butler_personal_memory_v1', '@butler_events_v1', '@butler_crawl_history_v1', '@butler_vault_index_v1'] as const;
const ENC_PREFIX = '__AESGCM1__';

export type IntegrityFinding = {
  key: string;
  status: 'ok' | 'missing' | 'tampered' | 'unreadable';
  detail: string;
};

export async function inspectProtectedStorage(): Promise<IntegrityFinding[]> {
  assertImmutablePolicyIntact();
  const rawPairs = await AsyncStorage.multiGet([...CHECK_KEYS]);
  const out: IntegrityFinding[] = [];
  for (const [key, raw] of rawPairs) {
    if (!raw) { out.push({ key, status: 'missing', detail: 'No record is currently present.' }); continue; }
    if (!raw.startsWith(ENC_PREFIX)) { out.push({ key, status: 'tampered', detail: 'Protected key is not stored as authenticated ciphertext.' }); continue; }
    const opened = await encryptedStorage.getItem(key);
    out.push(opened === null
      ? { key, status: 'unreadable', detail: 'Ciphertext exists but authentication or key recovery failed; plaintext was not returned.' }
      : { key, status: 'ok', detail: 'Authenticated ciphertext opened successfully; plaintext was not logged.' });
  }
  return out;
}
