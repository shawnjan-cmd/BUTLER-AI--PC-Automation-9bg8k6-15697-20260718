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
  signal?: AbortSignal;
};

export async function sendChat(
  cfg: ServerConfig,
  messages: ChatMessage[],
  opts: SendOptions,
): Promise<string> {
  const res = await fetchWithAuth(
    cfg,
    '/api/chat',
    {
      method: 'POST',
      body: JSON.stringify({
        model: opts.model,
        stream: false,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: opts.signal,
    },
    120_000,
  );
  if (!res.ok) {
    throw new Error(`Chat failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { message?: { content?: string } };
  return data?.message?.content ?? '';
}

export function newMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
  };
}
