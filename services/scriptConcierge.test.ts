import { buildScriptConcierge, parseScriptIntent, requiredQuestions } from './scriptConcierge';

const basic = buildScriptConcierge('Find large files in my Downloads folder and show me the result');
if (!basic.intent.needsFiles) throw new Error('file intent not detected');
if (basic.risk !== 'low') throw new Error('read-only file request should be low risk');
if (!basic.generationBrief) throw new Error('generation brief missing');

const dangerous = buildScriptConcierge('Delete all backups and shut down the computer');
if (dangerous.risk !== 'review') throw new Error('destructive request should require review');
if (!dangerous.questions.some(q => /dry-run|undo/i.test(q))) throw new Error('destructive clarification missing');

const credential = buildScriptConcierge('Log in with my password and download the report');
if (credential.risk !== 'blocked') throw new Error('credential request should be blocked at concierge stage');

const parsed = parseScriptIntent('When a new file appears, notify me and save a copy locally');
if (!parsed.trigger || !parsed.needsFiles) throw new Error('trigger/file intent not detected');

const questions = requiredQuestions(parsed, []);
if (questions.length === 0) throw new Error('ambiguous request should produce a question');

console.log('script concierge: PASS');
