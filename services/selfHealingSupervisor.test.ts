import { selfHealingSupervisor } from './selfHealingSupervisor';

selfHealingSupervisor.start();
const first = selfHealingSupervisor.report('network_timeout', 'endpoint timeout');
if (!first.applied || first.repair !== 'retry_with_backoff') throw new Error('network timeout must use bounded retry');
const unknown = selfHealingSupervisor.report('unknown', 'unclassified');
if (unknown.repair !== 'request_user_review' || unknown.applied) throw new Error('unknown failures must escalate');
let criticalRan = false;
void selfHealingSupervisor.runCritical('test-critical', async () => { criticalRan = true; return true; });
if (!criticalRan) throw new Error('critical operation was blocked');
selfHealingSupervisor.stop();
