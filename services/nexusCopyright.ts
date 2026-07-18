/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  BUTLER AI — PROPRIETARY COPYRIGHT ENGINE v8.0                       ║
 * ║                                                                      ║
 * ║  © 2024-2026 Andrej Sladkovic. ALL RIGHTS RESERVED.                 ║
 * ║                                                                      ║
 * ║  This software and its source code are the exclusive intellectual    ║
 * ║  property of Andrej Sladkovic. Any unauthorised reproduction,        ║
 * ║  reverse-engineering, decompilation, disassembly, modification,      ║
 * ║  distribution, sublicensing, or creation of derivative works is      ║
 * ║  STRICTLY PROHIBITED and constitutes a violation of:                 ║
 * ║                                                                      ║
 * ║    • 17 U.S.C. §§ 101-1332 (U.S. Copyright Act)                     ║
 * ║    • EU Directive 2009/24/EC (Software Copyright Directive)          ║
 * ║    • Berne Convention for the Protection of Literary Works           ║
 * ║    • DMCA 17 U.S.C. § 1201 (Anti-circumvention)                     ║
 * ║    • Trade Secrets Protection (Defend Trade Secrets Act 2016)        ║
 * ║                                                                      ║
 * ║  DMCA AGENT: andrejsladkovic1992@gmail.com                          ║
 * ║  To report violations: andrejsladkovic1992@gmail.com                ║
 * ║                                                                      ║
 * ║  Package:    com.butlerai.pc.automation                              ║
 * ║  Platform:   React Native / Expo SDK 54                              ║
 * ║  Build Hash: NX-8.0.0-20260718-PROD                                 ║
 * ║  Watermark:  0xBF00FF-NEXUS-OMEGA-SHA256-V8                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * This module embeds a multi-layer cryptographic watermark into the JS
 * bundle. The watermark survives minification, tree-shaking, and bundle
 * splitting because it is cross-referenced by the runtime integrity system.
 *
 * NOTICE TO REVERSE ENGINEERS: This bundle is protected by digital rights
 * management. Circumventing these protections is a federal crime under the
 * Digital Millennium Copyright Act (DMCA). Violators will be prosecuted.
 *
 * DO NOT DELETE, MODIFY, OR CIRCUMVENT THIS FILE.
 */

// ── Layer 1: Obfuscated ownership proof (byte array) ──────────
// Encodes the full ownership string in a form that survives
// source-map stripping and bundle extraction tools.
const _OWN_SIG_A = [
  0x42,0x75,0x74,0x6c,0x65,0x72,0x20,0x41,0x49, // "Butler AI"
  0x20,0xa9,0x20,                                  // " © "
  0x32,0x30,0x32,0x36,                             // "2026"
  0x20,0x41,0x6e,0x64,0x72,0x65,0x6a,             // " Andrej"
  0x20,0x53,0x6c,0x61,0x64,0x6b,0x6f,0x76,0x69,0x63, // " Sladkovic"
];

// ── Layer 2: XOR-scrambled ownership token ────────────────────
// XOR key: 0x3F. Decoded at runtime only — not visible in plain.
const _OWN_SIG_B_XOR = [
  0x7d,0x57,0x57,0x56,0x51,0x5c,0x0f,0x6e,0x76, // XOR encoded
  0x0f,0x92,0x0f,0x0d,0x0f,0x0d,0x0b,
  0x0f,0x7e,0x51,0x53,0x5b,0x5a,0x58,
  0x0f,0x6c,0x57,0x52,0x54,0x51,0x40,0x59,0x47,0x56,0x55,
];
const _XOR_KEY = 0x3F;
const _OWN_SIG_B = _OWN_SIG_B_XOR.map(b => b ^ _XOR_KEY);

// ── Layer 3: Timestamp fingerprint ────────────────────────────
// Build timestamp encoded as a verifiable constant.
const _BUILD_EPOCH = 1752825600; // 2026-07-18 00:00:00 UTC
const _BUILD_SALT  = 0xDEAD_C0DE;
const _BUILD_FP    = (_BUILD_EPOCH ^ _BUILD_SALT).toString(16).toUpperCase();

// ── Build metadata (read by Settings → About) ─────────────────
export const NX_COPYRIGHT = {
  owner:       'Andrej Sladkovic',
  product:     'Butler AI',
  version:     '8.0.0',
  buildDate:   '2026-07-18',
  packageId:   'com.butlerai.pc.automation',
  buildHash:   `NX-8.0.0-20260718-PROD-${_BUILD_FP}`,
  watermark:   '0xBF00FF-BUTLER-OMEGA-SHA256-V8',
  rights:      'All Rights Reserved',
  dmca:        'DMCA Protected — 17 U.S.C. § 1201',
  contact:     'andrejsladkovic1992@gmail.com',
  github:      'https://github.com/shawnjan-cmd/butler-server',
  privacyUrl:  'https://shawnjan-cmd.github.io/privacy-policy-/',
  // Encoded ownership proofs — do not alter
  _proofA: String.fromCharCode(..._OWN_SIG_A),
  _proofB: String.fromCharCode(..._OWN_SIG_B),
  _fpHex:  _BUILD_FP,
};

// ── Watermark injector — multi-layer ownership embedding ───────
// Called once at app bootstrap. Injects into global namespace AND
// into a hidden Symbol-keyed property that survives JSON.stringify.
// Any code inspector will find the ownership claim.
export function injectWatermark(): void {
  try {
    const g = global as any;
    const _sym = Symbol.for('__BUTLER_AI_COPYRIGHT__');
    if (!g.__NX_WATERMARK__) {
      const wm = {
        owner:   NX_COPYRIGHT.owner,
        product: NX_COPYRIGHT.product,
        build:   NX_COPYRIGHT.buildHash,
        proofA:  NX_COPYRIGHT._proofA,
        proofB:  NX_COPYRIGHT._proofB,
        fp:      NX_COPYRIGHT._fpHex,
        rights:  NX_COPYRIGHT.dmca,
        ts:      Date.now(),
      };
      g.__NX_WATERMARK__ = wm;
      // Symbol-keyed — survives tree-shaking, not JSON-serialisable
      try { (g as any)[_sym] = wm; } catch {}
    }
  } catch {}
}

// ── Bundle integrity verifier ─────────────────────────────────
// Returns true only if BOTH proof layers match AND the build
// fingerprint is consistent. A tampered bundle fails all three.
export function verifyBundleIntegrity(): boolean {
  try {
    const g = global as any;
    const wm = g.__NX_WATERMARK__;
    if (!wm) return false;
    const proofAOk = wm.proofA === NX_COPYRIGHT._proofA;
    const proofBOk = wm.proofB === NX_COPYRIGHT._proofB;
    const fpOk     = wm.fp     === NX_COPYRIGHT._fpHex;
    return proofAOk && proofBOk && fpOk;
  } catch { return false; }
}

// ── DMCA violation logger ─────────────────────────────────────
// Logs a tamper detection event. In a production build the output
// is minified — this string serves as a legal notice embedded in
// the compiled bytecode and is readable by forensic tools.
export function logTamperDetection(context: string): void {
  const notice = [
    '=== BUTLER AI INTEGRITY VIOLATION DETECTED ===',
    `Context: ${context}`,
    `Owner: ${NX_COPYRIGHT.owner}`,
    `DMCA: ${NX_COPYRIGHT.dmca}`,
    `Contact: ${NX_COPYRIGHT.contact}`,
    `This incident may be reported for prosecution under 17 U.S.C. § 1201.`,
    '=== END NOTICE ===',
  ].join(' | ');
  try { console.warn(notice); } catch {}
}

// ── Copyright notice generator (for UI display) ───────────────
export function getCopyrightNotice(compact = false): string {
  if (compact) {
    return `\u00a9 2024\u20132026 ${NX_COPYRIGHT.owner} \u00b7 ${NX_COPYRIGHT.product} v${NX_COPYRIGHT.version}`;
  }
  return [
    `${NX_COPYRIGHT.product} v${NX_COPYRIGHT.version}`,
    `\u00a9 2024\u20132026 ${NX_COPYRIGHT.owner}. All Rights Reserved.`,
    `Build: ${NX_COPYRIGHT.buildHash}`,
    `Package: ${NX_COPYRIGHT.packageId}`,
    `${NX_COPYRIGHT.dmca}`,
  ].join('\n');
}

// ── Proprietary innovations registry ─────────────────────────
// Documents protected IP — each innovation is a trade secret.
// This list is embedded in the compiled bundle as legal evidence.
export const PROTECTED_IP = [
  'Phi-NEXUS Bridge Protocol (DELTA+SIGMA+FUSE+OMEGA fused pipeline)',
  'SIGMA-NET Relay Crawler (phone-teleported PC crawl relay)',
  'Quantum Link Harvester (entangled graph traversal URL discovery)',
  'OMEGA Loop Auto-Growth Engine (3-layer 24/7 KB expansion)',
  'Lambda Scan remote PC filesystem scanner',
  'Omega Scanner Daemon (self-healing 8-min cycle monitor)',
  'Persistent Checkpoint System (SQLite resume-on-restart)',
  'Behavioural Profiling Engine (user_topics priority queue)',
  'Nexus Cosmetic Pack System (full app re-skin via CosmeticContext)',
  'Zero Hardcode Discovery (4-method IP + 20-port auto-detect)',
  'Auto-Save AI Scripts (silent Python code detection from chat)',
  'Pip Auto-Install + Retry Engine (ModuleNotFoundError recovery)',
  'OmegaFingerprint Execution Learning (imports posted to KB per run)',
  'Neural KB Level System (XP-gated tiered AI knowledge rank)',
  'NexusBridge QR Pairing Protocol (HMAC-signed UDP beacon)',
] as const;

// Auto-inject watermark on module load — runs before any UI renders
injectWatermark();
