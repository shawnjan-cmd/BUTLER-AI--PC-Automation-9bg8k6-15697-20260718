import { fetchWithAuth, type ServerConfig } from './connection';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type SendOptions = {
  model: string;
  systemPrompt?: string;
  signal?: AbortSignal;
};

type OllamaResponse = {
  message?: {
    content?: string;
  };
  response?: string;
};

function normalizeMessages(messages: ChatMessage[], systemPrompt?: string): Array<{ role: ChatRole; content: string }> {
  const normalized = messages
    .filter((message) => Boolean(message.content.trim()))
    .map((message) => ({ role: message.role, content: message.content.trim() }));

  if (systemPrompt?.trim()) {
    normalized.unshift({ role: 'system', content: systemPrompt.trim() });
  }

  return normalized;
}

function parseAssistantText(payload: OllamaResponse): string {
  const raw = payload?.message?.content ?? payload?.response ?? '';
  return String(raw).trim();
}

export async function sendChat(
  cfg: ServerConfig,
  messages: ChatMessage[],
  opts: SendOptions,
): Promise<string> {
  const response = await fetchWithAuth(
    cfg,
    '/api/chat',
    {
      method: 'POST',
      body: JSON.stringify({
        model: opts.model,
        stream: false,
        messages: normalizeMessages(messages, opts.systemPrompt),
      }),
      signal: opts.signal,
    },
    120_000,
  );

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Chat failed (${response.status}): ${details || response.statusText}`);
  }

  const payload = (await response.json()) as OllamaResponse;
  const text = parseAssistantText(payload);

  if (!text) {
    throw new Error('Server returned an empty assistant response.');
  }

  return text;
}

export function newMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
  };
}
