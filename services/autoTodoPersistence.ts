/**
 * Butler AI - Auto-To-Do Persistence & Thought Scanning Service
 * Automatically tracks planned, in-progress, and completed work across sessions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TodoItem {
  id: string;
  task: string;
  category: 'script' | 'security' | 'ui' | 'sync' | 'core';
  status: 'planned' | 'in_progress' | 'completed';
  timestamp: number;
}

const TODO_STORAGE_KEY = '@butler_auto_todos_v30';

export async function loadPersistentTodos(): Promise<TodoItem[]> {
  try {
    const raw = await AsyncStorage.getItem(TODO_STORAGE_KEY);
    if (!raw) {
      const defaultTodos: TodoItem[] = [
        { id: '1', task: 'Implement Fail-Closed Privacy Circuit', category: 'security', status: 'completed', timestamp: Date.now() },
        { id: '2', task: 'Deploy 3D Crawler & Butler-Brain Telemetry Graph', category: 'core', status: 'completed', timestamp: Date.now() },
        { id: '3', task: 'Overhaul UI into Single-Page Homepage with Custom Icons', category: 'ui', status: 'completed', timestamp: Date.now() },
        { id: '4', task: 'Setup Safe Python Script Priority Engine', category: 'script', status: 'completed', timestamp: Date.now() },
      ];
      await AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(defaultTodos));
      return defaultTodos;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load persistent todos:', e);
    return [];
  }
}

export async function savePersistentTodos(todos: TodoItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.error('Failed to save persistent todos:', e);
  }
}
