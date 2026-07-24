/**
 * BUTLER AI — Robot Mascot Tips
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 * 26 tips shown on robot tap — never repeat within 5 rotations.
 */

export const BUTLER_ROBOT_TIPS = [
  'Long-press any script in FORGE to pin it to Quick Actions.',
  'Butler runs every command on your PC — nothing touches the cloud.',
  'Say "clean my PC" to free gigabytes of temp files instantly.',
  'The Knowledge Base learns from any URL you crawl — try your company wiki.',
  'You can type on your PC from your phone via the Keyboard action in AI Chat.',
  'Pairing is one-time — your encrypted token persists in secure storage forever.',
  'AES-256-GCM encrypts all chat history — even if someone reads the DB, noise.',
  'The Automation Feed is a live audit trail — every Butler action is logged.',
  'Sparkline graph detects CPU spikes before your fans spin up.',
  'Scripts run in a sandboxed Python subprocess — safe from system damage.',
  'Titan Protocol scores your connection security on every handshake ping.',
  'Knowledge Base deduplicates crawled content — no noise, only signal.',
  'The Vault stores your most sensitive notes with the same AES-256 as chat.',
  'Live Terminal Feed shows 4 channels simultaneously — system, AI, network, security.',
  'NEXUS is Butler\'s command layer — your personal PC intelligence hub.',
  'Push any file from your phone to your PC Desktop in seconds via Files tab.',
  'Ollama local AI: no API key, no subscription, no data leaving your home.',
  'QR pairing code changes every session — never reuse old codes.',
  'Butler\'s rate limiter blocks brute force — 3 failed auths = 60s lockout.',
  'FLOWS lets you chain scripts into multi-step automations — like a macro, smarter.',
  'KB articles are deduplicated on import — same content from two sites = stored once.',
  'The SKINS tab lets you theme the entire app — ice, aurora, orchid, or verdant.',
  'Remote mode via Tailscale lets Butler reach your PC from anywhere.',
  'Script Forge has 250+ pre-written automations — browse by category.',
  'Double-tap the clock in the header to toggle 12/24 hour format.',
  'Swipe left/right between tabs to navigate — the whole screen slides.',
] as const;

export type ButlerRobotTip = typeof BUTLER_ROBOT_TIPS[number];
