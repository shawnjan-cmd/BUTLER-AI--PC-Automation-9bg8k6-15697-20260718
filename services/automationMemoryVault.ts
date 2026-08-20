/**
 * Butler AI — Automation Memory Vault
 *
 * A compact, encrypted, local-first memory layer shared conceptually between
 * the Android app and the paired PC. The phone retains intent summaries,
 * approved preferences, pattern identifiers and redacted receipts; executable
 * drafts and raw logs remain on the paired PC. The service never stores
 * passwords, tokens, full chat transcripts, raw script code or approval tokens.
 */

import { encryptedStorage } from './encryptedStorage';
import { admitMemory, memoryFingerprint } from './memoryAdmission';
import type { AutomationPlan } from './automationCommandContract';

const VAULT_KEY = '@butler_automation_memory_v1';
const VAULT_VERSION = 1;
const MAX_PLAN_HISTORY = 80;
const MAX_RECEIPTS = 80;

export type AutomationPatternCategory =
  | 'system' | 'files' | 'maintenance' | 'network' | 'security' | 'monitoring'
  | 'data' | 'developer' | 'ai' | 'learning';

export interface AutomationPattern {
  id: string;
  title: string;
  category: AutomationPatternCategory;
  summary: string;
  intentHints: string[];
  capability: 'pc.metrics.read' | 'pc.script.run';
  risk: 'read_only' | 'local_change' | 'review_required';
  prerequisites: string[];
  safeBoundary: string;
  templateKind: 'library_match' | 'draft_recipe';
}

export interface AutomationMemoryPlan {
  id: string;
  requestFingerprint: string;
  summary: string;
  risk: AutomationPlan['risk'];
  state: AutomationPlan['state'];
  createdAt: number;
  selectedPatternIds: string[];
}

export interface AutomationReceiptMemory {
  id: string;
  planId?: string;
  scriptId?: string;
  outcome: 'succeeded' | 'failed' | 'cancelled' | 'rejected';
  receiptFingerprint: string;
  createdAt: number;
}

export interface AutomationMemoryState {
  version: number;
  patterns: AutomationPattern[];
  planHistory: AutomationMemoryPlan[];
  receiptHistory: AutomationReceiptMemory[];
  preferences: {
    preferExistingPatterns: boolean;
    requireDryRun: boolean;
    allowExternalSideEffectDrafts: boolean;
  };
  lastSyncAt?: number;
}

/**
 * Curated original organization of common automation intents. These are not
 * executable code and do not imply that a platform or app is supported.
 */
const REVIEWED_PATTERN_CATALOG: AutomationPattern[] = [
  ['system_snapshot','System Snapshot','system','Collect OS, CPU, RAM, storage and uptime facts without changing the PC.',['system info','pc specs','cpu ram'],'pc.metrics.read','read_only',['paired PC'],'Read-only telemetry only.','library_match'],
  ['process_pressure','Process Pressure Map','system','Rank current CPU and memory pressure using local process metadata.',['top processes','high cpu','ram usage'],'pc.metrics.read','read_only',['paired PC'],'No process termination.','library_match'],
  ['disk_headroom','Disk Headroom Report','maintenance','Measure drive usage and report low-space risks.',['disk usage','free space','storage'],'pc.metrics.read','read_only',['paired PC'],'No cleanup runs automatically.','library_match'],
  ['temp_cleanup_preview','Temporary File Cleanup Preview','maintenance','Preview eligible temporary-file cleanup and estimate recovered space.',['clean temps','free disk','temporary files'],'pc.script.run','review_required',['reviewed scope','dry-run'],'Preview before any deletion.','draft_recipe'],
  ['download_sort_preview','Download Folder Sort Preview','files','Preview a rule-based organization of a user-selected download folder.',['organize downloads','sort files'],'pc.script.run','review_required',['user-selected folder','dry-run'],'Never moves files until approval.','draft_recipe'],
  ['duplicate_report','Duplicate Candidate Report','files','Create a hash-based duplicate candidate report for selected folders.',['duplicate files','duplicate report'],'pc.script.run','read_only',['user-selected folder'],'Reports candidates; never deletes.','draft_recipe'],
  ['large_file_report','Large File Inventory','files','Inventory unusually large files in a declared path.',['find large files','big files'],'pc.script.run','read_only',['user-selected folder'],'Read-only scan with bounded depth.','draft_recipe'],
  ['backup_manifest','Backup Manifest Builder','files','Prepare a backup manifest and dry-run copy plan for selected paths.',['backup','copy files'],'pc.script.run','review_required',['user-selected sources','user-selected destination','dry-run'],'No overwrite without explicit approval.','draft_recipe'],
  ['lan_inventory','LAN Device Inventory','network','Inventory local network interfaces and approved local hosts.',['lan scan','network devices'],'pc.script.run','review_required',['user-approved LAN scope'],'No internet scanning or exploitation.','draft_recipe'],
  ['port_visibility','Local Port Visibility','network','List local listening ports and owning processes for troubleshooting.',['open ports','listening ports'],'pc.script.run','read_only',['paired PC'],'No remote probing.','library_match'],
  ['connectivity_check','Service Connectivity Check','network','Check an approved local service address with timeouts.',['server status','check connection'],'pc.script.run','read_only',['approved host'],'Local or allowlisted target only.','draft_recipe'],
  ['security_posture','Security Posture Summary','security','Collect user-visible OS protection status and update configuration.',['security audit','antivirus status'],'pc.script.run','review_required',['supported OS','read-only commands'],'No evasion or security-control changes.','draft_recipe'],
  ['log_triage','Local Log Triage','security','Summarize a user-selected local log file for warnings and errors.',['analyze log','error log'],'pc.script.run','read_only',['user-selected log'],'Secrets are redacted before memory admission.','draft_recipe'],
  ['resource_watch','Resource Watch Rule','monitoring','Prepare a bounded monitor for CPU, RAM or disk thresholds.',['monitor cpu','watch memory'],'pc.script.run','review_required',['threshold','cooldown','user-approved notification'],'No unbounded background loop.','draft_recipe'],
  ['startup_review','Startup Review','system','List startup entries for user inspection.',['startup items','boot programs'],'pc.script.run','read_only',['supported OS'],'Does not disable entries.','library_match'],
  ['network_reset_plan','Network Repair Plan','network','Draft diagnostic checks before any network configuration change.',['fix network','internet issue'],'pc.script.run','review_required',['problem description','dry-run'],'No reset or adapter change without fresh approval.','draft_recipe'],
  ['csv_quality_check','CSV Quality Check','data','Inspect a selected CSV for headers, missing values and malformed rows.',['check csv','data quality'],'pc.script.run','read_only',['user-selected file'],'No data upload.','draft_recipe'],
  ['folder_manifest','Folder Manifest','files','Create a compact manifest of a selected folder for review or backup planning.',['folder inventory','file manifest'],'pc.script.run','read_only',['user-selected folder'],'Paths are not mirrored to the phone.','draft_recipe'],
  ['python_env_report','Python Environment Report','developer','Report local Python runtime, packages and virtual environments.',['python environment','pip packages'],'pc.script.run','read_only',['paired PC'],'Does not install packages.','library_match'],
  ['project_health','Project Health Check','developer','Run selected static checks for a user-selected local project.',['project health','typecheck'],'pc.script.run','review_required',['user-selected project','declared commands'],'No dependency installation by default.','draft_recipe'],
  ['ollama_health','Local Model Health','ai','Check local Ollama reachability, model availability and resource readiness.',['ollama status','model health'],'pc.script.run','read_only',['paired PC'],'Loopback-only by default.','library_match'],
  ['knowledge_index_plan','Knowledge Index Plan','learning','Prepare a bounded local indexing plan with source list and redaction rules.',['index documents','knowledge base'],'pc.script.run','review_required',['user-selected sources','redaction review'],'No cloud upload.','draft_recipe'],
  ['script_explainer','Script Explanation','learning','Explain a reviewed script using its AST and declared capabilities.',['explain script','what does this code do'],'pc.metrics.read','read_only',['script selected in library'],'Never executes code.','library_match'],
].map(([id, title, category, summary, intentHints, capability, risk, prerequisites, safeBoundary, templateKind]) => ({
  id: id as string,
  title: title as string,
  category: category as AutomationPatternCategory,
  summary: summary as string,
  intentHints: intentHints as string[],
  capability: capability as AutomationPattern['capability'],
  risk: risk as AutomationPattern['risk'],
  prerequisites: prerequisites as string[],
  safeBoundary: safeBoundary as string,
  templateKind: templateKind as AutomationPattern['templateKind'],
}));

function createDefaultState(): AutomationMemoryState {
  return {
    version: VAULT_VERSION,
    patterns: REVIEWED_PATTERN_CATALOG,
    planHistory: [],
    receiptHistory: [],
    preferences: {
      preferExistingPatterns: true,
      requireDryRun: true,
      allowExternalSideEffectDrafts: false,
    },
  };
}

function normalizeState(raw: unknown): AutomationMemoryState {
  const fallback = createDefaultState();
  if (!raw || typeof raw !== 'object') return fallback;
  const value = raw as Partial<AutomationMemoryState>;
  return {
    ...fallback,
    version: VAULT_VERSION,
    patterns: REVIEWED_PATTERN_CATALOG,
    planHistory: Array.isArray(value.planHistory) ? value.planHistory.slice(-MAX_PLAN_HISTORY) : [],
    receiptHistory: Array.isArray(value.receiptHistory) ? value.receiptHistory.slice(-MAX_RECEIPTS) : [],
    preferences: { ...fallback.preferences, ...(value.preferences || {}) },
    lastSyncAt: typeof value.lastSyncAt === 'number' ? value.lastSyncAt : undefined,
  };
}

class AutomationMemoryVault {
  private state: AutomationMemoryState | null = null;

  async load(): Promise<AutomationMemoryState> {
    if (this.state) return this.snapshot();
    try {
      const raw = await encryptedStorage.getItem(VAULT_KEY);
      this.state = normalizeState(raw ? JSON.parse(raw) : null);
    } catch {
      this.state = createDefaultState();
    }
    return this.snapshot();
  }

  private async persist(): Promise<void> {
    if (!this.state) await this.load();
    await encryptedStorage.setItem(VAULT_KEY, JSON.stringify(this.state));
  }

  snapshot(): AutomationMemoryState {
    return JSON.parse(JSON.stringify(this.state || createDefaultState()));
  }

  async findPatterns(request: string, limit = 5): Promise<AutomationPattern[]> {
    await this.load();
    const terms = request.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2);
    return (this.state?.patterns || []).map(pattern => ({
      pattern,
      score: terms.reduce((score, term) => score + (pattern.title.toLowerCase().includes(term) ? 4 : 0) + pattern.intentHints.filter(hint => hint.includes(term)).length * 3 + (pattern.summary.toLowerCase().includes(term) ? 1 : 0), 0),
    })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(limit, 12))).map(item => item.pattern);
  }

  async rememberPlan(plan: AutomationPlan, patternIds: string[] = []): Promise<void> {
    await this.load();
    const admission = admitMemory({
      text: `${plan.risk}:${plan.state}:${plan.summary}`,
      source: 'automation-plan', confidence: 1, sensitivity: 'public', durable: true,
      userApproved: true, provenanceId: memoryFingerprint(plan.planId),
    });
    if (!admission.admitted || !this.state) return;
    const record: AutomationMemoryPlan = {
      id: plan.planId,
      requestFingerprint: memoryFingerprint(plan.request),
      summary: plan.summary.slice(0, 280),
      risk: plan.risk,
      state: plan.state,
      createdAt: plan.createdAt,
      selectedPatternIds: patternIds.slice(0, 8),
    };
    this.state.planHistory = [record, ...this.state.planHistory.filter(item => item.id !== record.id)].slice(0, MAX_PLAN_HISTORY);
    await this.persist();
  }

  async rememberReceipt(input: { planId?: string; scriptId?: string; outcome: AutomationReceiptMemory['outcome']; receipt: unknown }): Promise<void> {
    await this.load();
    if (!this.state) return;
    const compact = JSON.stringify(input.receipt ?? {}).slice(0, 1600);
    const record: AutomationReceiptMemory = {
      id: `receipt-${Date.now().toString(36)}`,
      planId: input.planId,
      scriptId: input.scriptId?.slice(0, 96),
      outcome: input.outcome,
      receiptFingerprint: memoryFingerprint(compact),
      createdAt: Date.now(),
    };
    this.state.receiptHistory = [record, ...this.state.receiptHistory].slice(0, MAX_RECEIPTS);
    await this.persist();
  }

  /**
   * Produces a redacted manifest safe to synchronize to the paired PC. It is
   * intentionally insufficient to reconstruct source scripts, secrets, chats,
   * account identifiers or approval tokens.
   */
  async createPairingManifest(): Promise<Record<string, unknown>> {
    await this.load();
    const state = this.state || createDefaultState();
    return {
      version: VAULT_VERSION,
      generatedAt: Date.now(),
      patternIds: state.patterns.map(pattern => pattern.id),
      preferences: state.preferences,
      planCount: state.planHistory.length,
      receiptCount: state.receiptHistory.length,
      integrity: memoryFingerprint(JSON.stringify({ patterns: state.patterns.map(p => p.id), plans: state.planHistory.map(p => p.id), receipts: state.receiptHistory.map(r => r.id) })),
    };
  }

  async markSyncCompleted(): Promise<void> {
    await this.load();
    if (!this.state) return;
    this.state.lastSyncAt = Date.now();
    await this.persist();
  }
}

export const automationMemoryVault = new AutomationMemoryVault();
export { REVIEWED_PATTERN_CATALOG };
