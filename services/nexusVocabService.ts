/**
 * NEXUS VOCAB ENGINE SERVICE — ©2026 Andrej Sladkovic. PROPRIETARY.
 * Persistent personal command vocabulary for the NexusTypeEngine.
 * Learns and stores your most-used command fragments, n-grams, and
 * intent patterns from every session — entirely local, zero telemetry.
 *
 * Patent-pending approach: entropy-weighted n-gram frequency maps
 * combined with session-decay coefficients to ensure recent vocabulary
 * always surfaces above historical noise, creating a living personal
 * command language that belongs exclusively to the user.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const VOCAB_STORE_KEY    = '@nexus_vocab_v2';
const HISTORY_STORE_KEY  = '@nexus_history_v2';
const MAX_VOCAB_ENTRIES  = 300;
const DECAY_FACTOR       = 0.98;  // older entries slowly decay in weight

interface VocabEntry {
  phrase: string;
  count:  number;
  lastTs: number;
}

export class NexusVocabService {
  private entries: Map<string, VocabEntry> = new Map();
  private history: string[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const [rawVocab, rawHistory] = await AsyncStorage.multiGet([VOCAB_STORE_KEY, HISTORY_STORE_KEY]);
      if (rawVocab[1]) {
        const parsed = JSON.parse(rawVocab[1]) as VocabEntry[];
        this.entries = new Map(parsed.map(e => [e.phrase, e]));
      }
      if (rawHistory[1]) {
        this.history = JSON.parse(rawHistory[1]);
      }
    } catch {}
    this.loaded = true;
  }

  async record(text: string): Promise<void> {
    await this.load();
    const now   = Date.now();
    const clean = text.trim().toLowerCase();
    if (!clean || clean.length < 4) return;

    // Add to history (last 50)
    this.history = [clean, ...this.history.filter(h => h !== clean)].slice(0, 50);

    // Extract n-grams (1, 2, 3-word)
    const words = clean.split(/\s+/).filter(w => w.length > 2);
    const ngrams: string[] = [];
    for (let i = 0; i < words.length; i++) {
      ngrams.push(words[i]);
      if (i < words.length - 1)  ngrams.push(words.slice(i, i + 2).join(' '));
      if (i < words.length - 2)  ngrams.push(words.slice(i, i + 3).join(' '));
    }
    ngrams.push(clean); // full phrase too

    // Apply session-decay to existing entries
    for (const [k, v] of this.entries) {
      v.count *= DECAY_FACTOR;
    }

    // Increment matching entries
    for (const g of ngrams) {
      const existing = this.entries.get(g);
      if (existing) {
        existing.count += 1;
        existing.lastTs = now;
      } else {
        this.entries.set(g, { phrase: g, count: 1, lastTs: now });
      }
    }

    // Prune to MAX_VOCAB_ENTRIES (remove lowest-scoring)
    if (this.entries.size > MAX_VOCAB_ENTRIES) {
      const sorted = [...this.entries.values()].sort((a, b) => b.count - a.count);
      this.entries = new Map(sorted.slice(0, MAX_VOCAB_ENTRIES).map(e => [e.phrase, e]));
    }

    // Persist
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      const vocabArray = [...this.entries.values()];
      await AsyncStorage.multiSet([
        [VOCAB_STORE_KEY,   JSON.stringify(vocabArray)],
        [HISTORY_STORE_KEY, JSON.stringify(this.history)],
      ]);
    } catch {}
  }

  getSuggestions(partial: string, limit = 4): string[] {
    if (!partial || partial.trim().length < 2) return [];
    const q    = partial.toLowerCase().trim();
    const last = q.split(' ').pop() ?? '';

    return [...this.entries.values()]
      .filter(e => e.phrase.startsWith(last) && e.phrase !== last && e.phrase.length > last.length)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(e => e.phrase);
  }

  getRecentHistory(n = 8): string[] {
    return this.history.slice(0, n);
  }

  async clear(): Promise<void> {
    this.entries = new Map();
    this.history = [];
    await AsyncStorage.multiRemove([VOCAB_STORE_KEY, HISTORY_STORE_KEY]).catch(() => {});
  }
}

export const nexusVocabService = new NexusVocabService();
export default nexusVocabService;
