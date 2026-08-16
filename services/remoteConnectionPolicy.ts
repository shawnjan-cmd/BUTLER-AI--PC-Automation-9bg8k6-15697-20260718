export type RemoteSessionState = 'disabled' | 'setup_required' | 'ready' | 'active' | 'revoked' | 'sealed';

export interface RemoteSessionRecord {
  state: RemoteSessionState;
  endpoint: string | null;
  serverFingerprint: string | null;
  sessionId: string | null;
  userOptIn: boolean;
  lastReceiptAt: number | null;
}

export interface RemoteTransitionResult {
  ok: boolean;
  state: RemoteSessionState;
  reason: string;
}

export const initialRemoteSession = (): RemoteSessionRecord => ({
  state: 'disabled',
  endpoint: null,
  serverFingerprint: null,
  sessionId: null,
  userOptIn: false,
  lastReceiptAt: null,
});

export function configureRemote(
  current: RemoteSessionRecord,
  endpoint: string,
  serverFingerprint: string,
  userOptIn: boolean,
): RemoteTransitionResult {
  if (!userOptIn) return { ok: false, state: 'disabled', reason: 'explicit_user_opt_in_required' };
  if (!endpoint.trim() || !serverFingerprint.trim()) return { ok: false, state: 'setup_required', reason: 'endpoint_and_pinned_identity_required' };
  return { ok: true, state: 'ready', reason: 'remote_ready_for_authenticated_session' };
}

export function startRemoteSession(current: RemoteSessionRecord, sessionId: string, authenticated: boolean): RemoteTransitionResult {
  if (!current.userOptIn) return { ok: false, state: 'disabled', reason: 'remote_opt_in_disabled' };
  if (!current.endpoint || !current.serverFingerprint) return { ok: false, state: 'setup_required', reason: 'remote_identity_not_pinned' };
  if (!authenticated) return { ok: false, state: 'ready', reason: 'authenticated_session_required' };
  if (!sessionId.trim()) return { ok: false, state: 'ready', reason: 'session_receipt_required' };
  return { ok: true, state: 'active', reason: 'session_active' };
}

export function revokeRemote(current: RemoteSessionRecord): RemoteTransitionResult {
  return { ok: true, state: 'revoked', reason: 'remote_session_revoked' };
}

export function sealRemote(current: RemoteSessionRecord): RemoteTransitionResult {
  return { ok: true, state: 'sealed', reason: 'remote_side_effects_sealed' };
}
