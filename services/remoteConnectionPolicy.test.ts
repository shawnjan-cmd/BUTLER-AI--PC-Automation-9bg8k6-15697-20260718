import {
  configureRemote,
  initialRemoteSession,
  revokeRemote,
  sealRemote,
  startRemoteSession,
} from './remoteConnectionPolicy';

const base = initialRemoteSession();
const denied = configureRemote(base, 'https://example.invalid', '', true);
if (denied.ok || denied.state !== 'setup_required') throw new Error('identity pinning must be required');
const configured = configureRemote(base, 'https://example.invalid', 'sha256:test', true);
if (!configured.ok || configured.state !== 'ready') throw new Error('valid remote setup must become ready');
const record = { ...base, endpoint: 'https://example.invalid', serverFingerprint: 'sha256:test', userOptIn: true, state: 'ready' as const };
if (startRemoteSession(record, 'session-1', false).ok) throw new Error('unauthenticated remote session must fail');
if (!startRemoteSession(record, 'session-1', true).ok) throw new Error('authenticated remote session must start');
if (revokeRemote(record).state !== 'revoked') throw new Error('revoke transition failed');
if (sealRemote(record).state !== 'sealed') throw new Error('seal transition failed');
