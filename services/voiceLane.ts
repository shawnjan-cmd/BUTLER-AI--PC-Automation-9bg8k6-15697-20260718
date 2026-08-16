export type VoiceLaneState = 'off' | 'ready' | 'recording' | 'uploading' | 'transcribing' | 'thinking' | 'speaking' | 'cancelling' | 'fallback_text' | 'error';
export type VoiceQuality = 'low' | 'balanced' | 'high';

export interface VoiceBudget {
  maxChunkBytes: number;
  maxRecordingMs: number;
  maxResponseChars: number;
  preferredQuality: VoiceQuality;
  allowBackgroundCapture: false;
}

export interface VoiceSession {
  id: string;
  state: VoiceLaneState;
  startedAt: number;
  chunkCount: number;
  transcript: string;
  response: string;
  deletedAudio: boolean;
  receiptId?: string;
}

export const LOW_SPEC_VOICE_BUDGET: VoiceBudget = {
  maxChunkBytes: 256 * 1024,
  maxRecordingMs: 30_000,
  maxResponseChars: 4_000,
  preferredQuality: 'low',
  allowBackgroundCapture: false,
};

export const DEFAULT_VOICE_BUDGET: VoiceBudget = {
  maxChunkBytes: 512 * 1024,
  maxRecordingMs: 60_000,
  maxResponseChars: 8_000,
  preferredQuality: 'balanced',
  allowBackgroundCapture: false,
};

export function createVoiceSession(): VoiceSession {
  return {
    id: `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    state: 'ready',
    startedAt: Date.now(),
    chunkCount: 0,
    transcript: '',
    response: '',
    deletedAudio: false,
  };
}

export function canStartRecording(state: VoiceLaneState, userPressed: boolean): boolean {
  return userPressed && (state === 'ready' || state === 'fallback_text');
}

export function shouldFallbackToText(error: unknown): boolean {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase();
  return message.includes('permission') || message.includes('unsupported') || message.includes('timeout') || message.includes('resource');
}
