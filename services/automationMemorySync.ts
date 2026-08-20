/**
 * Butler AI — Automation Memory Sync
 * Synchronizes only the redacted pattern manifest between Android and the
 * paired PC. Source code, chat text, secrets, approval tokens and raw receipts
 * are intentionally excluded.
 */

import { serverConnection } from './serverConnection';
import { automationMemoryVault } from './automationMemoryVault';

export interface AutomationMemorySyncResult {
  ok: boolean;
  acceptedPatterns?: number;
  error?: string;
}

export async function syncAutomationMemoryManifest(): Promise<AutomationMemorySyncResult> {
  if (!serverConnection.isConnected()) return { ok: false, error: 'PC is not paired or connected' };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const manifest = await automationMemoryVault.createPairingManifest();
    const res = await serverConnection.request('/api/memory/automation-manifest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.status !== 'synced') {
      return { ok: false, error: String(body?.error || body?.reason || `Sync rejected (${res.status})`) };
    }
    await automationMemoryVault.markSyncCompleted();
    return { ok: true, acceptedPatterns: Number(body?.acceptedPatterns || 0) };
  } catch (error: any) {
    return { ok: false, error: error?.name === 'AbortError' ? 'Memory sync timed out' : String(error?.message || 'Memory sync failed') };
  } finally {
    clearTimeout(timeoutId);
  }
}

export default syncAutomationMemoryManifest;
