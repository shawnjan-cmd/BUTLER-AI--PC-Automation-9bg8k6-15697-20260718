/**
 * Butler AI — Consent-First Automation Command Contract
 *
 * Defines the boundary between a natural-language automation request and a
 * consequential PC action. A request is never executable merely because it
 * was typed in chat: it must become a visible plan, pass server preflight,
 * be saved as a reviewed Script Library draft, complete a dry run, and receive
 * a fresh explicit approval bound to the exact immutable script digest.
 */

export type AutomationRisk = 'read_only' | 'local_change' | 'external_side_effect' | 'blocked';
export type AutomationPlanState =
  | 'needs_clarification'
  | 'draft_ready'
  | 'preflight_required'
  | 'dry_run_required'
  | 'approval_required'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'blocked';

export interface AutomationPrerequisite {
  id: string;
  label: string;
  required: boolean;
  satisfied?: boolean;
}

export interface AutomationPlan {
  planId: string;
  request: string;
  summary: string;
  capability: 'pc.metrics.read' | 'pc.script.run';
  risk: AutomationRisk;
  state: AutomationPlanState;
  requiresExplicitApproval: boolean;
  scriptId?: string;
  scriptDigest?: string;
  prerequisites: AutomationPrerequisite[];
  warnings: string[];
  nextStep: string;
  createdAt: number;
}

const AUTOMATION_TERMS = /\b(script|python|automate|automation|download|install|organize|backup|rename|monitor|crawl|scan|clean|launch|open|send|request|discord|battle\.net|battlenet)\b/i;
const EXTERNAL_SIDE_EFFECT_TERMS = /\b(download|install|purchase|checkout|send|message|friend request|invite|discord|battle\.net|battlenet|account|login|sign in|post|upload|delete|remove)\b/i;
const BLOCKED_TERMS = /\b(bypass|crack|steal|credential|token|keylog|malware|ransomware|ddos|exfiltrat|evade|self[- ]?delete)\b/i;

export function isAutomationRequest(request: string): boolean {
  return AUTOMATION_TERMS.test(request.trim());
}

export function classifyAutomationRisk(request: string): AutomationRisk {
  const normalized = request.trim();
  if (!normalized || BLOCKED_TERMS.test(normalized)) return 'blocked';
  return EXTERNAL_SIDE_EFFECT_TERMS.test(normalized) ? 'external_side_effect' : 'local_change';
}

/**
 * Creates only an offline preview. The paired server remains authoritative and
 * creates the real plan, because it alone can validate connection, capability,
 * saved-script digest, sandbox and Flow Ledger receipt state.
 */
export function createAutomationPlanPreview(request: string): AutomationPlan {
  const normalized = request.trim();
  const risk = classifyAutomationRisk(normalized);
  const external = risk === 'external_side_effect';
  const blocked = risk === 'blocked';
  const missingDetail = normalized.length < 12;

  const prerequisites: AutomationPrerequisite[] = [
    { id: 'paired_pc', label: 'Paired PC connection is verified', required: true },
    { id: 'vault', label: 'Local vault session is unlocked', required: true },
    { id: 'script_review', label: 'Generated script is reviewed in Script Library', required: true },
    { id: 'dry_run', label: 'Sandbox dry-run passes for the exact draft', required: true },
  ];

  if (external) {
    prerequisites.splice(2, 0,
      { id: 'app_ready', label: 'Requested desktop app is installed and already signed in by the user', required: true },
      { id: 'user_present', label: 'User remains present for final external-action confirmation', required: true },
    );
  }

  const warnings = blocked
    ? ['This request contains an unsafe or prohibited action and cannot be turned into a Butler workflow.']
    : external
      ? ['This plan may affect an external account or service. Butler will not bypass login, payment, age, platform, or account protections.', 'A fresh approval is required immediately before each external side effect.']
      : ['No action will run from chat alone. The final script must be reviewed, linted, dry-run, and approved.'];

  return {
    planId: `local-preview-${Date.now().toString(36)}`,
    request: normalized,
    summary: blocked
      ? 'Unsafe automation request blocked before planning.'
      : missingDetail
        ? 'Clarify the goal, target application, and the intended safe outcome before drafting.'
        : external
          ? 'Prepare a user-reviewed local workflow with individual confirmation checkpoints for consequential steps.'
          : 'Prepare a local, reversible automation draft for Script Library review.',
    capability: blocked ? 'pc.metrics.read' : 'pc.script.run',
    risk,
    state: blocked ? 'blocked' : missingDetail ? 'needs_clarification' : 'preflight_required',
    requiresExplicitApproval: !blocked,
    prerequisites,
    warnings,
    nextStep: blocked
      ? 'Choose a lawful, user-authorized task with a bounded outcome.'
      : missingDetail
        ? 'Provide the exact goal and whether the action only reads data or changes the PC or an external service.'
        : 'Pair the PC, then create a server-validated plan and save the proposed draft to Script Library.',
    createdAt: Date.now(),
  };
}

export function formatAutomationPlan(plan: AutomationPlan): string {
  const header = plan.state === 'blocked' ? 'AUTOMATION REQUEST BLOCKED' : 'AUTOMATION PLAN — REVIEW REQUIRED';
  const required = plan.prerequisites.filter(item => item.required).map(item => `• ${item.label}`).join('\n');
  const warnings = plan.warnings.map(item => `• ${item}`).join('\n');
  return [
    header,
    plan.summary,
    '',
    `RISK: ${plan.risk.replace(/_/g, ' ').toUpperCase()}`,
    '',
    'REQUIRED CHECKPOINTS',
    required,
    '',
    'GUARDS',
    warnings,
    '',
    `NEXT: ${plan.nextStep}`,
  ].join('\n');
}

export function isExternalSideEffect(plan: AutomationPlan): boolean {
  return plan.risk === 'external_side_effect';
}

export const AUTOMATION_COMMAND_VERSION = 1;

export default createAutomationPlanPreview;
