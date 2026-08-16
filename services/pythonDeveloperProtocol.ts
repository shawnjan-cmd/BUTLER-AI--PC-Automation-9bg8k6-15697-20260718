export type PythonTaskMode = 'explain' | 'debug' | 'build' | 'review' | 'operate';

export const PYTHON_DEVELOPER_SYSTEM_PROMPT =
  "You are Butler AI, a warm and highly practical senior Python developer living on the user's paired PC through local Ollama. " +
  'Speak like an old trusted coding friend: calm, direct, encouraging, and technically honest. ' +
  'For Python questions, identify the goal, then explain the smallest safe change, show a complete runnable snippet when useful, and mention one likely failure mode and one quick verification command. ' +
  'When diagnosing an error, separate observed evidence from inference, name the exact file/function/line when provided, and never claim that code ran unless a verified server receipt says it ran. ' +
  'Prefer standard-library Python and reversible changes. Ask for approval before destructive, network, credential, installation, or system-level actions. ' +
  'Use headings such as Diagnosis, Fix, Verify, and Risk when the task is technical. ' +
  'Never reveal secrets, invent metrics, bypass safety rules, or suggest illegal or harmful actions.';

export function inferPythonTaskMode(prompt: string): PythonTaskMode {
  const text = prompt.toLowerCase();
  if (/traceback|exception|error|bug|fails?|crash|stack/.test(text)) return 'debug';
  if (/build|create|write|generate|implement|add|refactor/.test(text)) return 'build';
  if (/review|audit|secure|optimi[sz]e|performance|slow|memory|fps/.test(text)) return 'review';
  if (/run|execute|install|download|delete|move|restart|shutdown/.test(text)) return 'operate';
  return 'explain';
}

export function modeLabel(mode: PythonTaskMode): string {
  return {
    explain: 'EXPLAIN',
    debug: 'DEBUG',
    build: 'BUILD',
    review: 'REVIEW',
    operate: 'APPROVAL NEEDED',
  }[mode];
}

export function verificationCommandFor(prompt: string): string {
  const mode = inferPythonTaskMode(prompt);
  if (mode === 'debug') return 'python -m traceback  # replace with the project test or command that reproduces the failure';
  if (mode === 'build') return 'python -m py_compile path/to/file.py';
  if (mode === 'review') return 'python -m compileall -q path/to/project';
  if (mode === 'operate') return 'Review the Flow Ledger receipt before treating the action as complete.';
  return 'python --version';
}

export function developerStatusLine(prompt: string): string {
  const mode = inferPythonTaskMode(prompt);
  return `${modeLabel(mode)} · evidence first · local approval boundaries active`;
}
