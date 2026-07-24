/**
 * piiRedactor.ts — strips personal / credential material from text
 * BEFORE it is stored in the KB, written to logs, or exported.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */

const PATTERNS: Array<[RegExp, string]> = [
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[JWT]'],
  [/\b(sk|pk|rk)-[A-Za-z0-9]{20,}\b/g,                    '[API-KEY]'],
  [/\bghp_[A-Za-z0-9]{36,}\b/g,                           '[GITHUB-TOKEN]'],
  [/\bAKIA[0-9A-Z]{16}\b/g,                               '[AWS-KEY]'],
  [/\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*/gi,               'Bearer [TOKEN]'],
  [/\b[0-9a-f]{64}\b/gi,                                  '[HEX-SECRET-256]'],
  [/\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g,                     '[EMAIL]'],
  [/\b(?:\+?\d{1,3}[ -]?)?(?:\(\d{1,4}\)[ -]?)?\d{3}[ -]?\d{3,4}[ -]?\d{3,4}\b/g, '[PHONE]'],
  [/\b(?:\d[ -]?){13,19}\b/g,                             '[CARD-NUMBER]'],
  [/\b[A-Z]{2}\d{2}[ ]?(?:[A-Z0-9]{4}[ ]?){3,7}\b/g,      '[IBAN]'],
  [/[A-Z]:\\Users\\[^\\\s"']+/gi,                         'C:\\Users\\[USER]'],
  [/\/home\/[^/\s"']+/g,                                  '/home/[USER]'],
  [/\/Users\/[^/\s"']+/g,                                 '/Users/[USER]'],
];

export function redactPII(text: string): string {
  let out = text;
  for (const [re, repl] of PATTERNS) out = out.replace(re, repl);
  return out;
}

export function containsPII(text: string): boolean {
  return PATTERNS.some(([re]) => {
    const r = new RegExp(re.source, re.flags);
    return r.test(text);
  });
}
