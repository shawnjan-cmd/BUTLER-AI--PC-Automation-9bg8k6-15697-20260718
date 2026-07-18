/**
 * personalMemory.ts — Butler AI Personal Memory Service
 * Stores user-defined personal info, events, birthdays, reminders.
 * Local-only, encrypted via AsyncStorage. Zero cloud.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@butler_personal_memory_v1';
const EVENTS_KEY = '@butler_events_v1';
const CRAWL_HISTORY_KEY = '@butler_crawl_history_v1';

export interface PersonalFact {
  id: string;
  key: string;        // "name", "mom_birthday", etc.
  value: string;      // "Alex", "March 15", etc.
  category: 'identity' | 'family' | 'health' | 'preferences' | 'work' | 'custom';
  addedAt: number;
}

export interface MemoryEvent {
  id: string;
  title: string;
  date: string;        // ISO date "YYYY-MM-DD"
  type: 'birthday' | 'anniversary' | 'reminder' | 'deadline' | 'custom';
  color?: string;
  notes?: string;
  recurring?: boolean; // repeat yearly
}

export interface CrawlHistoryEntry {
  url: string;
  ts: number;
  wordsAdded: number;
  topic: string;
}

class PersonalMemoryService {
  private facts: PersonalFact[] = [];
  private events: MemoryEvent[] = [];
  private crawlHistory: CrawlHistoryEntry[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const [factsRaw, eventsRaw, crawlRaw] = await Promise.all([
        AsyncStorage.getItem(KEY),
        AsyncStorage.getItem(EVENTS_KEY),
        AsyncStorage.getItem(CRAWL_HISTORY_KEY),
      ]);
      this.facts  = factsRaw  ? JSON.parse(factsRaw)  : this.getDefaultFacts();
      this.events = eventsRaw ? JSON.parse(eventsRaw) : this.getDefaultEvents();
      this.crawlHistory = crawlRaw ? JSON.parse(crawlRaw) : [];
      this.loaded = true;
    } catch {
      this.facts  = this.getDefaultFacts();
      this.events = this.getDefaultEvents();
      this.loaded = true;
    }
  }

  private getDefaultFacts(): PersonalFact[] {
    return [
      { id: 'u1', key: 'AI Name',      value: 'Butler',              category: 'identity',    addedAt: Date.now() },
      { id: 'u2', key: 'Privacy Mode', value: 'Zero Cloud · LAN',    category: 'preferences', addedAt: Date.now() },
      { id: 'u3', key: 'System',       value: 'Local AI · No Cloud', category: 'preferences', addedAt: Date.now() },
    ];
  }

  private getDefaultEvents(): MemoryEvent[] {
    return [];
  }

  async save(): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(KEY, JSON.stringify(this.facts)),
      AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(this.events)),
      AsyncStorage.setItem(CRAWL_HISTORY_KEY, JSON.stringify(this.crawlHistory.slice(-50))),
    ]);
  }

  // ── Facts ──────────────────────────────────────────────────────
  getFacts(): PersonalFact[] {
    return [...this.facts];
  }

  async addFact(key: string, value: string, category: PersonalFact['category'] = 'custom'): Promise<PersonalFact> {
    await this.load();
    const existing = this.facts.findIndex(f => f.key.toLowerCase() === key.toLowerCase());
    if (existing >= 0) {
      this.facts[existing].value = value;
      this.facts[existing].addedAt = Date.now();
      await this.save();
      return this.facts[existing];
    }
    const fact: PersonalFact = { id: `f_${Date.now()}`, key, value, category, addedAt: Date.now() };
    this.facts.push(fact);
    await this.save();
    return fact;
  }

  async removeFact(id: string): Promise<void> {
    this.facts = this.facts.filter(f => f.id !== id);
    await this.save();
  }

  getFact(key: string): string | null {
    const f = this.facts.find(f => f.key.toLowerCase() === key.toLowerCase());
    return f?.value ?? null;
  }

  // ── Events & Reminders ─────────────────────────────────────────
  getEvents(): MemoryEvent[] {
    return [...this.events];
  }

  getUpcomingEvents(daysAhead = 30): { event: MemoryEvent; daysUntil: number }[] {
    const now = new Date();
    const results: { event: MemoryEvent; daysUntil: number }[] = [];

    for (const event of this.events) {
      let target = new Date(event.date);

      // For recurring events, use this year's date
      if (event.recurring) {
        target = new Date(now.getFullYear(), target.getMonth(), target.getDate());
        if (target < now) {
          target.setFullYear(now.getFullYear() + 1);
        }
      }

      const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= daysAhead) {
        results.push({ event, daysUntil: diff });
      }
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  async addEvent(event: Omit<MemoryEvent, 'id'>): Promise<MemoryEvent> {
    await this.load();
    const newEvent: MemoryEvent = { ...event, id: `ev_${Date.now()}` };
    this.events.push(newEvent);
    await this.save();
    return newEvent;
  }

  async removeEvent(id: string): Promise<void> {
    this.events = this.events.filter(e => e.id !== id);
    await this.save();
  }

  // ── Crawl history ─────────────────────────────────────────────
  async addCrawlEntry(url: string, wordsAdded: number, topic: string): Promise<void> {
    await this.load();
    this.crawlHistory.push({ url, ts: Date.now(), wordsAdded, topic });
    await this.save();
  }

  getCrawlHistory(): CrawlHistoryEntry[] {
    return [...this.crawlHistory].reverse().slice(0, 20);
  }

  // ── Build context string for Butler AI prompts ─────────────────
  async buildPersonalContext(): Promise<string> {
    await this.load();
    if (this.facts.length === 0 && this.events.length === 0) return '';

    const lines: string[] = ['USER PERSONAL MEMORY:'];
    this.facts.forEach(f => lines.push(`  ${f.key}: ${f.value}`));

    const upcoming = this.getUpcomingEvents(60);
    if (upcoming.length > 0) {
      lines.push('UPCOMING EVENTS:');
      upcoming.forEach(({ event, daysUntil }) => {
        const when = daysUntil === 0 ? 'TODAY!' : daysUntil === 1 ? 'TOMORROW!' : `in ${daysUntil} days`;
        lines.push(`  ${event.title} (${event.type}) — ${when}`);
      });
    }

    return lines.join('\n');
  }
}

export const personalMemory = new PersonalMemoryService();
