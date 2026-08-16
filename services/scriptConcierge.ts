import { findScripts } from './pythonAutomationKnowledge';
import type { AutomationScript } from './scriptTypes';

export type ScriptRequestMode = 'find' | 'adapt' | 'create' | 'blocked';
export type ScriptRisk = 'low' | 'review' | 'blocked';

export interface ScriptIntent {
  request: string;
  goal: string;
  target?: string;
  trigger?: string;
  output?: string;
  constraints: string[];
  needsNetwork: boolean;
  needsFiles: boolean;
  needsCredentials: boolean;
  destructive: boolean;
}

export interface ScriptMatch {
  script: AutomationScript;
  score: number;
  reasons: string[];
}

export interface ScriptConciergeResult {
  mode: ScriptRequestMode;
  risk: ScriptRisk;
  intent: ScriptIntent;
  matches: ScriptMatch[];
  questions: string[];
  explanation: string;
  generationBrief?: string;
}

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'want', 'make', 'please', 'can', 'butler', 'script']);
const NETWORK_WORDS = /\b(download|upload|web|website|internet|http|https|scrape|crawl|email|slack|discord|api|network|url)\b/i;
const FILE_WORDS = /\b(file|files|folder|directory|rename|move|copy|backup|delete|compress|pdf|csv|excel|document|desktop|drive)\b/i;
const CREDENTIAL_WORDS = /\b(password|credential|token|secret|api key|login|sign in|cookie)\b/i;
const DESTRUCTIVE_WORDS = /\b(delete|wipe|shred|shutdown|restart|format|kill|disable|uninstall|overwrite|send|publish|post|install)\b/i;
const TRIGGER_WORDS = /\b(?:every|each|when|whenever|after|before|at \d|on startup|on login|schedule|timer|watch)\b/i;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 1200);
}

function words(text: string): string[] {
  return clean(text).toLowerCase().replace(/[^a-z0-9_ -]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function firstMatch(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[0]?.trim();
}

export function parseScriptIntent(request: string): ScriptIntent {
  const text = clean(request);
  const lower = text.toLowerCase();
  const constraints: string[] = [];
  if (/only|just|without|don'?t|do not|safe|dry run|preview/i.test(lower)) constraints.push('respect explicit user constraints');
  if (/no admin|without admin|non-admin/i.test(lower)) constraints.push('avoid administrator privileges');
  if (/local only|offline|no internet|lan only/i.test(lower)) constraints.push('keep processing local or LAN-only');
  return {
    request: text,
    goal: text,
    target: firstMatch(text, /(?:on|from|in|for)\s+[^,.!?]+/i),
    trigger: firstMatch(text, TRIGGER_WORDS),
    output: firstMatch(text, /(?:save|write|export|show|notify|return|produce)\s+[^,.!?]+/i),
    constraints,
    needsNetwork: NETWORK_WORDS.test(text),
    needsFiles: FILE_WORDS.test(text),
    needsCredentials: CREDENTIAL_WORDS.test(text),
    destructive: DESTRUCTIVE_WORDS.test(text),
  };
}

export function scoreLibraryMatches(intent: ScriptIntent, limit = 5): ScriptMatch[] {
  const queryWords = words(intent.request);
  return findScripts(intent.request).slice(0, limit).map((script, index) => {
    const text = `${script.title} ${script.category} ${script.description} ${script.tags.join(' ')}`.toLowerCase();
    const overlap = queryWords.filter(word => text.includes(word));
    const reasons = overlap.slice(0, 3).map(word => `matches “${word}”`);
    if (intent.needsNetwork && /web|network|email|monitor/i.test(text)) reasons.push('network-capable category');
    if (intent.needsFiles && /file|backup|data|text/i.test(text)) reasons.push('file/data-capable category');
    return { script, score: Math.max(1, 100 - index * 8 + overlap.length * 4), reasons };
  });
}

export function requiredQuestions(intent: ScriptIntent, matches: ScriptMatch[]): string[] {
  const questions: string[] = [];
  if (!intent.target && (intent.needsFiles || intent.needsNetwork)) questions.push('What exact files, folder, website, or PC target should it use?');
  if (!intent.output) questions.push('What should count as success, and where should the result appear or be saved?');
  if (intent.trigger && !/every|each|when|after|before|at|startup|login/i.test(intent.trigger)) questions.push('Should this be run once on approval, or should Butler only prepare a reminder for you to confirm later?');
  if (intent.needsCredentials) questions.push('Which approved credential reference should it use? Never paste the secret into chat; Butler must use a protected reference.');
  if (intent.destructive) questions.push('Should Butler create a dry-run and undo plan first? Destructive actions remain approval-required.');
  if (matches.length === 0) questions.push('Can you give one example input and the exact result you want?');
  return questions.slice(0, 4);
}

export function buildGenerationBrief(intent: ScriptIntent, matches: ScriptMatch[]): string {
  const related = matches.slice(0, 3).map(hit => `- ${hit.script.title}: ${hit.script.description} [${hit.script.tags.join(', ')}]`).join('\n');
  return [
    'BUTLER SCRIPT CONCIERGE — DRAFT ONLY',
    `User goal: ${intent.goal}`,
    `Target: ${intent.target || 'not specified'}`,
    `Trigger: ${intent.trigger || 'one-time after explicit approval'}`,
    `Output: ${intent.output || 'explain and show a verifiable result'}`,
    `Constraints: ${intent.constraints.join('; ') || 'none stated'}`,
    `Capabilities: files=${intent.needsFiles}; network=${intent.needsNetwork}; credentials=${intent.needsCredentials}; destructive=${intent.destructive}`,
    'Related library candidates:', related || '- none; create a minimal standard-library draft',
    'Rules: produce complete Python, prefer standard library, include timeout/error handling, state dependencies, include a dry-run or undo plan where possible, never execute, and never invent a successful test receipt.',
  ].join('\n');
}

export function buildScriptConcierge(request: string): ScriptConciergeResult {
  const intent = parseScriptIntent(request);
  const matches = scoreLibraryMatches(intent);
  const questions = requiredQuestions(intent, matches);
  const risk: ScriptRisk = intent.needsCredentials || /self harm|suicide|malware|ransomware|steal|credential dump|bypass/i.test(intent.request)
    ? 'blocked'
    : intent.destructive || intent.needsNetwork
      ? 'review'
      : 'low';
  const mode: ScriptRequestMode = risk === 'blocked' ? 'blocked' : matches.length > 0 && questions.length <= 1 ? 'find' : matches.length > 0 ? 'adapt' : 'create';
  const explanation = risk === 'blocked'
    ? 'I cannot create or run that script. I can help with a safe, lawful alternative.'
    : matches.length > 0
      ? `I found ${matches.length} related script${matches.length === 1 ? '' : 's'} in the local library. I will show the closest match before drafting anything new.`
      : 'I did not find a confident library match, so I can draft a small Python script after the missing details are answered.';
  return {
    mode,
    risk,
    intent,
    matches,
    questions,
    explanation,
    generationBrief: risk === 'blocked' ? undefined : buildGenerationBrief(intent, matches),
  };
}
