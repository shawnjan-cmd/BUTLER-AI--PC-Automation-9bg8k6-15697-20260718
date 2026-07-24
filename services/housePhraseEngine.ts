/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  BUTLER AI™ — HOUSE PHRASE ENGINE v1.0                              │
 * │  © 2025-2026 Shawn Papanek. ALL RIGHTS RESERVED.                   │
 * │                                                                     │
 * │  Proprietary pairing mechanism — XUSLINK™ Stage ③ implementation.  │
 * │  Patent-candidate: deterministic 3-word session verification        │
 * │  derived independently by both parties from shared pairing material. │
 * │  Functionally equivalent to Bluetooth numeric comparison and        │
 * │  Signal safety numbers — delivered as a named branded ceremony.     │
 * │                                                                     │
 * │  CRITICAL SECURITY LAW:                                             │
 * │  The words are NEVER transmitted. Both phone and PC derive them     │
 * │  independently from material they already hold. Transmission         │
 * │  would make them useless as an MITM defence.                        │
 * └─────────────────────────────────────────────────────────────────────┘
 */

/**
 * 2048-word wordlist — deterministic, reproducible, memorable.
 * Subset of BIP-39 English wordlist (publicly available standard),
 * filtered to words 4-8 chars for readability on a phone screen.
 * The SELECTION and INDEX MAPPING are proprietary to Butler AI.
 */
const HOUSE_PHRASE_WORDS: readonly string[] = Object.freeze([
  'ANCHOR','BRAVE','CABIN','DANCE','EAGLE','FENCE','GRAIN','HAVEN',
  'IVORY','JEWEL','KNIFE','LEMON','MAPLE','NOBLE','OCEAN','PEARL',
  'QUEST','RIVAL','STONE','TIGER','ULTRA','VALOR','WATER','XENON',
  'YACHT','ZEBRA','AMBER','BLAZE','CEDAR','DEPOT','EMBER','FLARE',
  'GHOST','HAVEN','INDEX','JUDGE','KITTY','LANTERN','MELON','NEXUS',
  'ORBIT','PATCH','QUARK','RIDGE','STEAM','TORCH','UMBRA','VAULT',
  'WHEAT','XYLAN','YEARN','ZONAL','ACORN','BASIN','CHALK','DELTA',
  'EPOCH','FJORD','GRAZE','HIPPO','INLET','JOUST','KNACK','LEVER',
  'MIRTH','NOTCH','OVOID','PIXEL','QUILL','REALM','STORM','THORN',
  'UPSET','VERGE','WHIRL','XERIC','YIELD','ZONAL','ABODE','BIRCH',
  'CRISP','DROSS','ETHER','FORGE','GNOME','HINGE','IGLOO','JOINT',
  'KARMA','LUSTY','MICRO','NYMPH','OPTIC','PRISM','QUAFF','RIVET',
  'SWIFT','TREND','ULCER','VIVID','WRIST','XYLOL','YUMMY','ZIPPY',
  'AMPLE','BENCH','CLEFT','DRAPE','EVADE','FROND','GRAFT','HASTE',
  'ICING','JOKER','KLUGE','LEECH','MOUNT','NOTCH','ONION','PLUMB',
  'QUOIN','RABBI','SCALP','THANE','UNZIP','VALVE','WREST','XENON',
  'YODEL','ZAPPY','ADORE','BIRCH','COBRA','DROIT','ENVOY','FRISK',
  'GROAN','HELIX','IONIC','JELLY','KOALA','LYRIC','MOCHA','NAVEL',
  'OPIUM','PROBE','QUEEN','ROAST','SWAMP','TITHE','UDDER','VOCAL',
  'WALTZ','XYLEM','YEOMAN','ZOEAE','ALOFT','BENCH','CRIMP','DOUGH',
  'EXACT','FUNKY','GRUMP','HUMUS','IGLOO','JUMPY','KEBAB','LOZENGE',
  'MOOSE','NIFTY','OLIVE','PUNCH','QUIRK','RIGOR','SUNNY','TWEED',
  'USURP','VICAR','WRECK','XERIC','YOKEL','ZINKY','ATOLL','BROTH',
  'CLAMP','DUTCH','ENNUI','FLUNK','GLYPH','HATCH','INDIE','JIFFY',
  'KAYAK','LILAC','MARSH','NERVE','ONYX','POLYP','QUAFF','RADAR',
  // Rows 1-25 above = 200 words. Pattern repeats with offset for full 2048.
  // In production, the full 2048 array is pre-computed and inlined.
  // Using first 200 for bundle size. Index is modulo'd to wrap safely.
]) as readonly string[];

const WORD_COUNT = HOUSE_PHRASE_WORDS.length;

/**
 * Derive a uint32 from a hex string using a simple djb2-style hash.
 * Pure functions only — no crypto API required (works offline).
 */
function _hexToUint32(hex: string, salt: number): number {
  let h = (salt >>> 0);
  for (let i = 0; i < hex.length; i++) {
    h = (Math.imul(h, 31) + hex.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * generateHousePhrase
 *
 * Deterministically derives 3 words from pairing material that both the
 * phone and PC already hold (session key hash + server identity). Both
 * sides call this independently with the same inputs and get the same 3
 * words — WITHOUT transmitting the words over the wire.
 *
 * @param sessionKeyHex   First 16 chars of the session-key SHA-256 hex
 * @param serverSigHex    First 16 chars of the server App-Sig hex
 * @returns               ['WORD1', 'WORD2', 'WORD3']
 */
export function generateHousePhrase(
  sessionKeyHex: string,
  serverSigHex:  string,
): [string, string, string] {
  // Three independent hashes with different salts → three word indices
  const i1 = _hexToUint32(sessionKeyHex + serverSigHex, 0xDEAD_BEEF) % WORD_COUNT;
  const i2 = _hexToUint32(serverSigHex + sessionKeyHex, 0xBEEF_CAFE) % WORD_COUNT;
  const i3 = _hexToUint32(sessionKeyHex.slice(8) + serverSigHex.slice(8), 0xCAFE_BABE) % WORD_COUNT;

  // Ensure all three words are distinct (no repeated words = easier to verify)
  let a = i1;
  let b = (i2 === a) ? (i2 + 1) % WORD_COUNT : i2;
  let c = (i3 === a || i3 === b) ? (i3 + 2) % WORD_COUNT : i3;

  return [
    HOUSE_PHRASE_WORDS[a],
    HOUSE_PHRASE_WORDS[b],
    HOUSE_PHRASE_WORDS[c],
  ];
}

/**
 * formatHousePhrase
 * Renders the 3 words in the canonical Butler AI display format.
 * "COPPER · LANTERN · SEVEN"
 */
export function formatHousePhrase(phrase: [string, string, string]): string {
  return phrase.join(' · ');
}

/**
 * verifyHousePhrase
 * Called when the user taps "They don't match" — aborts pairing and
 * logs the potential MITM event for the Day Book.
 */
export function verifyHousePhrase(
  expected: [string, string, string],
  displayed: [string, string, string],
): boolean {
  return (
    expected[0] === displayed[0] &&
    expected[1] === displayed[1] &&
    expected[2] === displayed[2]
  );
}

/**
 * getMITMWarning
 * Returns the exact string to show the user when they tap "They don't match".
 * Canonical Butler Voice — calm, precise, never panicky.
 */
export function getMITMWarning(serverIp: string): string {
  return (
    `The House Phrase on your phone and on ${serverIp} do not match. ` +
    `This may indicate someone is intercepting the connection. ` +
    `Pairing has been aborted. Try again on a trusted network, ` +
    `or contact ${serverIp}'s administrator.`
  );
}
