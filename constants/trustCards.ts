/**
 * trustCards.ts — Security credential cards for TrustCarousel onboarding component.
 * 12 cards rotating in sets of 6, proving specific security properties.
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import type { NexusIconName } from '@/components/ui/NexusIcons';

export interface TrustCard {
  icon:  NexusIconName;
  value: string;
  label: string;
  color: string;
  icon2: NexusIconName;
}

export const TRUST_CARDS: readonly TrustCard[] = [
  // Page 1
  { icon: 'lock',      value: 'AES-256', label: 'GCM ENCRYPT',    color: '#00FF88', icon2: 'shield'    },
  { icon: 'wifi-hud',  value: 'LAN',     label: 'ONLY MODE',       color: '#00E5FF', icon2: 'signal'    },
  { icon: 'eye',       value: 'NO',      label: 'TELEMETRY',        color: '#FF7700', icon2: 'close-hud' },
  { icon: 'data-flow', value: '0',       label: 'CLOUD RELAY',      color: '#A366F5', icon2: 'circuit'   },
  { icon: 'chip',      value: '64C',     label: 'TOKEN LENGTH',     color: '#00E5FF', icon2: 'cpu'       },
  { icon: 'shield',    value: 'SHA',     label: '256 HMAC',         color: '#00FF88', icon2: 'check-hud' },
  // Page 2
  { icon: 'terminal',  value: 'OPEN',    label: 'SOURCE CODE',      color: '#FDBA74', icon2: 'download'  },
  { icon: 'server',    value: 'LOCAL',   label: 'AI ONLY',          color: '#A366F5', icon2: 'ai-brain'  },
  { icon: 'scan',      value: 'ZERO',    label: 'DATA LEAK',        color: '#00FF88', icon2: 'radar'     },
  { icon: 'memory',    value: 'HMAC',    label: 'EVERY REQUEST',    color: '#00E5FF', icon2: 'sync'      },
  { icon: 'power',     value: 'ZERO',    label: 'TRUST ACCESS',     color: '#FF7700', icon2: 'crosshair' },
  { icon: 'bolt',      value: 'NO',      label: 'ACCOUNT NEEDED',   color: '#00FF88', icon2: 'check-hud' },
] as const;
