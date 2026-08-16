import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@butler_cosmetic_inventory_names_v1';
const PREFIXES = ['NOVA', 'ORBIT', 'EMBER', 'VECTOR', 'PIXEL', 'FORGE', 'AURORA', 'NEXUS', 'MOSAIC', 'VANTA'];
const SUFFIXES = ['01', '07', '12', '19', '24', '31', '42', '58', '64', '88'];

function hash(value: string): number { let result = 17; for (let index = 0; index < value.length; index += 1) result = (result * 31 + value.charCodeAt(index)) | 0; return Math.abs(result); }
export async function loadInventoryNames(ids: readonly string[]): Promise<Record<string, string>> {
  try { const raw = await AsyncStorage.getItem(KEY); const stored = raw ? JSON.parse(raw) as Record<string, string> : {}; const next = { ...stored }; ids.forEach(id => { if (!next[id]) { const n = hash(`${id}:${Date.now()}`); next[id] = `${PREFIXES[n % PREFIXES.length]}-${SUFFIXES[(n >> 3) % SUFFIXES.length]}`; } }); await AsyncStorage.setItem(KEY, JSON.stringify(next)); return Object.fromEntries(ids.map(id => [id, next[id]])); } catch { return Object.fromEntries(ids.map(id => [id, `ITEM-${String(hash(id) % 999).padStart(3, '0')}`])); }
}
