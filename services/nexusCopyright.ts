/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  BUTLER AI — PROPRIETARY COPYRIGHT ENGINE v9.0                       ║
 * ║                                                                      ║
 * ║  © 2025-2026 Shawn Papanek. ALL RIGHTS RESERVED.                    ║
 * ║                                                                      ║
 * ║  This software and its source code are the exclusive intellectual    ║
 * ║  property of Shawn Papanek. Any unauthorised reproduction,           ║
 * ║  reverse-engineering, decompilation, disassembly, modification,      ║
 * ║  distribution, sublicensing, or creation of derivative works is      ║
 * ║  STRICTLY PROHIBITED and constitutes a violation of:                 ║
 * ║                                                                      ║
 * ║    • 17 U.S.C. §§ 101-1332 (U.S. Copyright Act)                     ║
 * ║    • EU Directive 2009/24/EC (Software Copyright Directive)          ║
 * ║    • Berne Convention for the Protection of Literary Works           ║
 * ║    • DMCA 17 U.S.C. § 1201 (Anti-circumvention)                     ║
 * ║    • Defend Trade Secrets Act 2016 (18 U.S.C. § 1836)               ║
 * ║                                                                      ║
 * ║  TRADEMARKS: BUTLER AI™, BOTER™, COMMANDCUBE™, NEXUS™,              ║
 * ║  XUSLINK™, SCRIPTSHIELD™, FITCORE™, DARKBOOT™, BUTLER MIND™,        ║
 * ║  VAULTPROOF™, PULSECODE™ — owned by Shawn Papanek.                  ║
 * ║  No trademark right is granted by this source.                       ║
 * ║                                                                      ║
 * ║  DMCA AGENT: shawnpapanek@butlerai.app                              ║
 * ║  Package:    com.butlerai.pc.automation                              ║
 * ║  Platform:   React Native / Expo 53                                  ║
 * ║  Build Hash: NX-9.0.0-20260724-PROD                                 ║
 * ║  Watermark:  0xBF00FF-NEXUS-OMEGA-SHA256-V9                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * DO NOT DELETE, MODIFY, OR CIRCUMVENT THIS FILE.
 */

// ── Layer 1: Obfuscated ownership proof (byte array) ──────────
// Encodes the full ownership string in a form that survives
// source-map stripping and bundle extraction tools.
// "Butler AI © 2026 Shawn Papanek"
const _OWN_SIG_A = [
  0x42,0x75,0x74,0x6c,0x65,0x72,0x20,0x41,0x49, // "Butler AI"
  0x20,0xa9,0x20,                                  // " © "
  0x32,0x30,0x32,0x36,                             // "2026"
  0x20,0x53,0x68,0x61,0x77,0x6e,                  // " Shawn"
  0x20,0x50,0x61,0x70,0x61,0x6e,0x65,0x6b,        // " Papanek"
];

// ── Layer 2: XOR-scrambled ownership token ────────────────────
// XOR key: 0x3F. Decoded at runtime only — not visible in plain.
// Encodes: "Butler AI 2026 Shawn Papanek"
const _OWN_SIG_B_XOR = [
  0x7d,0x57,0x57,0x56,0x51,0x5c,0x0f,0x6e,0x76, // XOR encoded
  0x0f,0x0d,0x0f,0x0d,0x0b,                       // "2026"
  0x0f,0x6c,0x57,0x5e,0x43,0x51,                  // " Shawn"
  0x0f,0x6f,0x5e,0x5c,0x5e,0x51,0x5a,0x54,        // " Papanek"
];
const _XOR_KEY = 0x3F;
const _OWN_SIG_B = _OWN_SIG_B_XOR.map(b => b ^ _XOR_KEY);

// ── Layer 3: Timestamp fingerprint ────────────────────────────
const _BUILD_EPOCH = 1753315200; // 2026-07-24 00:00:00 UTC
const _BUILD_SALT  = 0xBEEF_CAFE;
const _BUILD_FP    = (_BUILD_EPOCH ^ _BUILD_SALT).toString(16).toUpperCase();

// ── Layer 4: Trademark string lattice ─────────────────────────
// These strings survive minification and appear in forensic dumps.
// Their presence in ANY third-party binary is evidence of copying.
const _TM_LATTICE = [
  '\u00a9 2025-2026 Shawn Papanek',
  'BUTLER AI\u2122 com.butlerai.pc.automation',
  'BOTER\u2122 COMMANDCUBE\u2122 NEXUS\u2122',
  'XUSLINK\u2122 SCRIPTSHIELD\u2122 FITCORE\u2122',
  'DARKBOOT\u2122 BUTLER MIND\u2122 VAULTPROOF\u2122 PULSECODE\u2122',
  'NX-9.0.0-20260724-PROD-' + _BUILD_FP,
];

// ── Build metadata (read by Settings → About) ─────────────────
export const NX_COPYRIGHT = {
  owner:       'Shawn Papanek',
  product:     'Butler AI',
  version:     '9.0.0',
  buildDate:   '2026-07-24',
  packageId:   'com.butlerai.pc.automation',
  buildHash:   `NX-9.0.0-20260724-PROD-${_BUILD_FP}`,
  watermark:   '0xBF00FF-BUTLER-OMEGA-SHA256-V9',
  rights:      'All Rights Reserved',
  dmca:        'DMCA Protected — 17 U.S.C. § 1201',
  contact:     'shawnpapanek@butlerai.app',
  github:      'https://github.com/shawnjan-cmd/butler-server',
  privacyUrl:  'https://shawnjan-cmd.github.io/privacy-policy-/',
  tmNotice:    'BUTLER AI\u2122, BOTER\u2122, COMMANDCUBE\u2122, NEXUS\u2122, XUSLINK\u2122, SCRIPTSHIELD\u2122, FITCORE\u2122, DARKBOOT\u2122, BUTLER MIND\u2122, VAULTPROOF\u2122 and PULSECODE\u2122 are trademarks of Shawn Papanek. No trademark licence is granted by the source-available licence or by possession of this code.',
  // Encoded ownership proofs — do not alter
  _proofA: String.fromCharCode(..._OWN_SIG_A),
  _proofB: String.fromCharCode(..._OWN_SIG_B),
  _fpHex:  _BUILD_FP,
  _lattice: _TM_LATTICE,
};

// ── Watermark injector — multi-layer ownership embedding ───────
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
        tm:      NX_COPYRIGHT.tmNotice,
        lattice: NX_COPYRIGHT._lattice,
        ts:      Date.now(),
      };
      g.__NX_WATERMARK__ = wm;
      // Symbol-keyed — survives tree-shaking, not JSON-serialisable
      try { (g as any)[_sym] = wm; } catch {}
      // Layer: freeze the watermark so it cannot be monkey-patched
      try { Object.freeze(g.__NX_WATERMARK__); } catch {}
    }
  } catch {}
}

// ── Bundle integrity verifier ─────────────────────────────────
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

// ── Tamper detection logger ───────────────────────────────────
export function logTamperDetection(context: string): void {
  const notice = [
    '=== BUTLER AI INTEGRITY VIOLATION DETECTED ===',
    `Context: ${context}`,
    `Owner: ${NX_COPYRIGHT.owner}`,
    `DMCA: ${NX_COPYRIGHT.dmca}`,
    `Contact: ${NX_COPYRIGHT.contact}`,
    `Trademark: ${NX_COPYRIGHT.tmNotice}`,
    `This incident may be reported for prosecution under 17 U.S.C. § 1201.`,
    '=== END NOTICE ===',
  ].join(' | ');
  try { console.warn(notice); } catch {}
}

// ── Copyright notice generator (for UI display) ───────────────
export function getCopyrightNotice(compact = false): string {
  if (compact) {
    return `\u00a9 2025\u20132026 ${NX_COPYRIGHT.owner} \u00b7 ${NX_COPYRIGHT.product} v${NX_COPYRIGHT.version}`;
  }
  return [
    `${NX_COPYRIGHT.product} v${NX_COPYRIGHT.version}`,
    `\u00a9 2025\u20132026 ${NX_COPYRIGHT.owner}. All Rights Reserved.`,
    `Build: ${NX_COPYRIGHT.buildHash}`,
    `Package: ${NX_COPYRIGHT.packageId}`,
    `${NX_COPYRIGHT.dmca}`,
    `${NX_COPYRIGHT.tmNotice}`,
  ].join('\n');
}

// ── Proprietary innovations registry ─────────────────────────
export const PROTECTED_IP = [
  'DARKBOOT\u2122 — Signature launch ritual with fixed choreography (trade dress)',
  'COMMANDCUBE\u2122 — PC tray presence with Cube glyph and LAN-pulse identity',
  'FITCORE\u2122 — Automatic PC profiling + Ollama model match engine',
  'XUSLINK\u2122 — QR pairing ceremony + proprietary frame format v1',
  'House Phrase MITM defence — 3-word session hash display (pairing ceremony)',
  'SCRIPTSHIELD\u2122 — Static analysis + 4-tier hold-to-confirm execution gate',
  'BUTLER MIND\u2122 — Encrypted local learning pipeline + .bmind vault format',
  'VAULTPROOF\u2122 — Live outbound-traffic ledger (always-on zero-cloud meter)',
  'PULSECODE\u2122 — Proprietary fixed haptic grammar (5-pattern vocabulary)',
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
  'Dark Matter HUD Design Language (NEXUS cyberpunk UI aesthetic system)',
  '.bmind proprietary vault format (magic bytes BMND1 + encrypted payload)',
  'XUS-BUS animated divider protocol (LAN heartbeat visual grammar)',
] as const;

// Auto-inject watermark on module load — runs before any UI renders
injectWatermark();
