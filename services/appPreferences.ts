import { getItem, removeItem, setItem } from './storage';

const KEY = 'butler.app.preferences.v2';

export type AppPreferences = {
  defaultModel: string;
  systemPrompt: string;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  defaultModel: 'llama3.1:8b',
  systemPrompt: 'You are Butler AI. Be concise, practical, and action oriented.',
};

export async function loadPreferences(): Promise<AppPreferences> {
  const stored = await getItem<Partial<AppPreferences>>(KEY);

  return {
    defaultModel: String(stored?.defaultModel ?? DEFAULT_PREFERENCES.defaultModel).trim() || DEFAULT_PREFERENCES.defaultModel,
    systemPrompt: String(stored?.systemPrompt ?? DEFAULT_PREFERENCES.systemPrompt),
  };
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  await setItem(KEY, {
    defaultModel: preferences.defaultModel.trim() || DEFAULT_PREFERENCES.defaultModel,
    systemPrompt: preferences.systemPrompt,
  });
}

export async function resetPreferences(): Promise<void> {
  await removeItem(KEY);
}
