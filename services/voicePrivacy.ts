import { encryptedStorage } from './encryptedStorage';

const VOICE_RECEIPTS_KEY = '@butler_voice_receipts_v1';
const MAX_RECEIPTS = 30;

export interface VoiceReceipt {
  id: string;
  createdAt: number;
  transcriptChars: number;
  responseChars: number;
  audioPersisted: false;
  deletedAt: number;
}

export async function recordEphemeralVoiceReceipt(input: {
  id: string;
  transcriptChars: number;
  responseChars: number;
}): Promise<void> {
  const raw = await encryptedStorage.getItem(VOICE_RECEIPTS_KEY).catch(() => null);
  let receipts: VoiceReceipt[] = [];
  try { receipts = raw ? JSON.parse(raw) : []; } catch { receipts = []; }
  receipts.push({
    id: input.id,
    createdAt: Date.now(),
    transcriptChars: Math.max(0, input.transcriptChars),
    responseChars: Math.max(0, input.responseChars),
    audioPersisted: false,
    deletedAt: Date.now(),
  });
  await encryptedStorage.setItem(VOICE_RECEIPTS_KEY, JSON.stringify(receipts.slice(-MAX_RECEIPTS))).catch(() => {});
}

export async function clearVoiceReceipts(): Promise<void> {
  await encryptedStorage.removeItem(VOICE_RECEIPTS_KEY).catch(() => {});
}
