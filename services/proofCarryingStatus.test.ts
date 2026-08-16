import { canRenderAsLive, statusProof, visibleStatus } from './proofCarryingStatus';

const fresh = statusProof({ value: 42, source: 'pc.metrics', collectedAtMs: 100, expiresAtMs: 200, receiptId: 'r1' }, 150);
if (fresh.state !== 'fresh' || fresh.value !== 42 || !canRenderAsLive(fresh)) throw new Error('fresh proof failed');

const stale = statusProof({ value: 42, source: 'pc.metrics', collectedAtMs: 100, expiresAtMs: 200 }, 200);
if (stale.state !== 'stale' || stale.value !== null || canRenderAsLive(stale)) throw new Error('stale proof failed');

const uncertain = statusProof({ value: 42, source: 'pc.metrics', collectedAtMs: 100, expiresAtMs: 200 }, 50);
if (uncertain.state !== 'clock_uncertain' || uncertain.value !== null) throw new Error('clock proof failed');

const action = visibleStatus('CPU', { value: 95, source: 'pc.metrics', collectedAtMs: 0, expiresAtMs: 1 }, 2);
if (!action.actionable || action.value !== null) throw new Error('visible stale proof failed');

console.log('proof-carrying status: PASS');
