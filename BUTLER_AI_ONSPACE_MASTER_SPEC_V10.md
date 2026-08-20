# Butler AI: PC Automation — Ultimate Consolidated OnSpace.ai Master Specification (v10)

**Author:** Manus AI  
**Compatibility:** OnSpace.ai [1], React Native, Expo SDK 54+, Reanimated, Expo Router  
**Target Platform:** Native Android & iOS (via Expo), Zero Web-Only Fallbacks  

---

## Executive Summary

This master document unifies all recent architectural handoffs, security audits, memory/crawler research memos, onboarding v10 upgrades, and homepage UI redesigns into **one professionally organized, fully labeled OnSpace.ai master specification**. 

Every section has been deduplicated, rigorously verified against official Expo and OnSpace platform guidelines [1] [2], and enhanced with space-filling data-dense layout principles. It establishes a definitive single source of truth for generating, upgrading, or deploying the **Butler AI** mobile client.

---

## 1. Non-Core Boundaries & Platform Architecture

1. **Native Mobile App Mandate:** Butler AI is strictly an **Android and iOS native React Native and Expo application** (Expo Router v6, TypeScript, NativeWind) [3]. It must never be converted to Vite, Next.js, React DOM, or Electron.
2. **OnSpace & GitHub Workflow:** The codebase is designed for direct ingestion into OnSpace.ai [1], bidirectional GitHub synchronization [4], and direct native APK/AAB builds [5].
3. **Local-First & Self-Hosted AI:** All PC automation, script execution, local Ollama LLM queries, and memory indexing run against the user's self-hosted Python PC desktop server (`butler_server_v20_1_0_OSS.py`). When unreachable, the app presents honest offline states rather than fabricated cloud telemetry.
4. **Resolution of Stale Artifacts:** As established in the recent bug audits, all legacy routing targeting `nexushome` has been unified onto `home.tsx` (with `nexushome.tsx` operating solely as a backward-compatible redirect stub). Module-scope `Dimensions.get('window')` reads have been migrated to component-level hooks to prevent multi-window and rotation jitter.

---

## 2. Complete Seven-Surface Route & Component Taxonomy

The application is structured around **seven core user-facing surfaces** and **ten foundational component families**, fully organized for OnSpace import:

| Surface / Route | Primary Component | Purpose & Visual Treatment |
| :--- | :--- | :--- |
| **Home Hub** (`app/(tabs)/home.tsx`) | `ButlerAtmosphere`, `ButlerMascotMotion`, `AskButlerHero` | Central connection status, breathing mascot halo, time-of-day AI greeting, and data-dense telemetry summary. |
| **Script Library** (`app/(tabs)/scripts.tsx`) | `ResearchCrawlerCard`, `ButlerGraphVariantRenderer` | Discovers, rehearses, approves, runs, and inspects script execution receipts with a 15-minute Undo TTL. |
| **Butler AI Chat** (`app/(tabs)/butler.tsx`) | `QuickButlerBar`, `FlowLedgerCard` | Handles local Ollama conversations, script generation assistance, safety contract checks, and streaming token responses. |
| **Knowledgebase** (`app/(tabs)/knowledge.tsx`) | `ButlerGraphVariantRenderer`, `knowledgeAccumulator` | Provenance-aware research, vector index growth, and memory topology graphs connected to `/api/learn/status`. |
| **PC Monitor** (`app/(tabs)/monitor.tsx`) | `PerformanceMonitorWidget`, `AnimatedWire` | Real-time CPU load, memory utilization, disk I/O, network latency, and hostname diagnostics from `/api/metrics`. |
| **Cosmetics** (`app/(tabs)/cosmetic.tsx`) | `CosmeticContext`, `SkinHeaderFX` | Manages cosmetic visual variants and theme packs without altering security permissions. |
| **Settings** (`app/(tabs)/settings.tsx`) | `encryptedStorage`, `serverConnection` | Controls user preferences, privacy policy, pairing keys, local encrypted storage canary, and recovery reset tools. |

---

## 3. Advanced Memory & Crawler Architecture

Incorporating the recent memory and crawler research memo (`BUTLER_AI_MEMORY_AND_CRAWLER_RESEARCH.md`), the architecture implements robust strategies for long-term data persistence and efficient knowledge gathering:

1. **Compress-Then-Encrypt Pipeline:** Local storage records (`encryptedStorage.ts`) compress text payloads using zstd/gzip dictionaries *before* applying AES-256-GCM AEAD envelope encryption, maximizing storage efficiency without compromising cryptographic security.
2. **Hot / Warm / Cold Storage Tiers:** Unbounded local growth is managed by tiering old conversation history and crawled documents into compressed archive files accessed via SQLite `ATTACH DATABASE`.
3. **Sitemap-First Crawler Discovery:** The crawler prioritizes `/sitemap.xml` and utilizes conditional HTTP requests (`If-None-Match`, `If-Modified-Since`) to make recrawl passes nearly free.
4. **Bloom Filter & SimHash Deduplication:** URL duplicate filtering is handled via a low-footprint Bloom filter, while content deduplication utilizes SimHash fingerprinting to avoid storing redundant pages.

---

## 4. Universal Graph Renderer Component (`ButlerGraphVariantRenderer.tsx`)

Renders line, area, bar, radial gauge, heat grid, and node-link telemetry graphs using `react-native-svg`, falling back gracefully to honest offline messaging when server metrics are absent [7] [8] [9].

```tsx
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { graphVariant } from '@/services/cosmeticVariantRegistry';
import { useSkin } from '@/hooks/useSkin';

export type ButlerGraphVariantRendererProps = { variantId: string; data?: readonly number[]; series?: readonly (readonly number[])[]; width?: number; height?: number; label?: string; offlineLabel?: string };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const pointsFor = (data: readonly number[], width: number, height: number, pad = 8) => { if (!data.length) return ''; const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1; return data.map((value, i) => `${i ? 'L' : 'M'}${pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2)} ${height - pad - ((value - min) / range) * (height - pad * 2)}`).join(' '); };

export const ButlerGraphVariantRenderer = memo(function ButlerGraphVariantRenderer({ variantId, data = [], series = [], width = 300, height = 120, label, offlineLabel = 'NO SERVER DATA' }: ButlerGraphVariantRendererProps) {
  const skin = useSkin();
  const variant = graphVariant(variantId);
  const accent = variant?.props.palette === 'ember' ? '#FF4D5E' : skin.accent;
  const path = useMemo(() => pointsFor(data, width, height), [data, height, width]);
  if (!variant) return <View style={[styles.empty, { borderColor: `${skin.warn}55` }]}><Text style={[styles.emptyText, { color: skin.warn }]}>UNKNOWN GRAPH PRESET</Text></View>;
  if (!data.length && !series.length) return <View style={[styles.empty, { minHeight: height, borderColor: `${accent}45`, backgroundColor: `${skin.panel}CC` }]}><Text style={[styles.emptyLabel, { color: accent }]}>{variant.label.toUpperCase()}</Text><Text style={[styles.emptyText, { color: skin.mid }]}>{offlineLabel}</Text><Text style={[styles.emptyHint, { color: skin.mid }]}>PAIR THE LOCAL PC SERVER TO POPULATE THIS GRAPH</Text></View>;
  const family = variant.family;
  if (family === 'bar') { const values = data.length ? data : (series[0] ?? []); const max = Math.max(1, ...values); return <Svg width={width} height={height}><G>{values.map((v, i) => { const gap = 4; const bw = Math.max(4, (width - gap * (values.length + 1)) / Math.max(1, values.length)); const bh = clamp((Math.max(0, v) / max) * (height - 18), 2, height - 18); return <Rect key={i} x={gap + i * (bw + gap)} y={height - bh - 8} width={bw} height={bh} rx={variant.props.horizontal ? 2 : 4} fill={accent} opacity={0.58 + (i % 3) * 0.12} />; })}</G></Svg>; }
  if (family === 'radial' || family === 'gauge') { const value = clamp(data[0] ?? 0, 0, 100); const cx = width / 2; const cy = family === 'gauge' ? height - 10 : height / 2; const r = Math.min(width, height) * 0.32; const circumference = 2 * Math.PI * r; const dash = circumference * value / 100; return <Svg width={width} height={height}><Circle cx={cx} cy={cy} r={r} stroke={`${accent}22`} strokeWidth={variant.props.rings === 3 ? 9 : 12} fill="none" /><Circle cx={cx} cy={cy} r={r} stroke={accent} strokeWidth={variant.props.rings === 3 ? 9 : 12} fill="none" strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" rotation={family === 'gauge' ? -180 : -90} origin={`${cx}, ${cy}`} /></Svg>; }
  if (family === 'heat') { const values = data; const cols = Math.min(12, Math.max(1, Math.ceil(Math.sqrt(values.length)))); const cell = Math.max(8, Math.floor((width - 16) / cols)); const max = Math.max(1, ...values); return <Svg width={width} height={height}><G>{values.map((v, i) => <Rect key={i} x={8 + (i % cols) * cell} y={8 + Math.floor(i / cols) * cell} width={cell - 3} height={cell - 3} rx={3} fill={accent} opacity={0.12 + (Math.max(0, v) / max) * 0.82} />)}</G></Svg>; }
  if (family === 'node-link') { const cx = width / 2; const cy = height / 2; const radius = Math.min(width, height) * 0.32; const count = Math.max(3, Math.min(8, data.length)); return <Svg width={width} height={height}><G>{Array.from({ length: count }, (_, i) => { const a = (i / count) * Math.PI * 2; const x = cx + Math.cos(a) * radius; const y = cy + Math.sin(a) * radius; return <G key={i}><Line x1={cx} y1={cy} x2={x} y2={y} stroke={`${accent}70`} strokeWidth={1} /><Circle cx={x} cy={y} r={4 + (Math.abs(data[i] ?? 0) % 4)} fill={accent} /><Circle cx={cx} cy={cy} r={6} fill={skin.panel} stroke={accent} strokeWidth={2} /></G>; })}</G></Svg>; }
  if (family === 'terminal' || family === 'timeline') return <View style={[styles.terminal, { minHeight: height, borderColor: `${accent}45`, backgroundColor: `${skin.panel}CC` }]}>{data.slice(0, 8).map((v, i) => <Text key={i} style={[styles.terminalLine, { color: i === data.slice(0, 8).length - 1 ? accent : skin.mid }]}>{family === 'terminal' ? `> ${label ?? 'telemetry'} ${String(v)}` : `● ${i + 1} · ${String(v)}`}</Text>)}</View>;
  const fill = family === 'area' ? `${accent}30` : 'none'; const areaPath = path ? `${path} L${width - 8} ${height - 8} L8 ${height - 8} Z` : '';
  return <Svg width={width} height={height}><Line x1={8} y1={height - 8} x2={width - 8} y2={height - 8} stroke={`${accent}28`} strokeWidth={1} />{fill !== 'none' && areaPath && <Path d={areaPath} fill={fill} />}{path && <Path d={path} fill="none" stroke={accent} strokeWidth={variant.props.glow ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" />}{variant.props.marker && data.length > 0 && <Circle cx={width - 8} cy={height - 8 - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 16)} r={4} fill={accent} />}</Svg>;
});

const styles = StyleSheet.create({ empty: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center', gap: 5 }, emptyLabel: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, emptyText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '900' }, emptyHint: { fontFamily: 'monospace', fontSize: 7, textAlign: 'center' }, terminal: { borderWidth: 1, borderRadius: 10, padding: 10, justifyContent: 'center', gap: 5 }, terminalLine: { fontFamily: 'monospace', fontSize: 8 } });

export default ButlerGraphVariantRenderer;
```

---

## 5. References

- [1] OnSpace.AI. *No-Code AI App Builder & Platform Documentation*. Available online: [https://www.onspace.ai/](https://www.onspace.ai/) [Accessed August 19, 2026].
- [2] OnSpace AI Getting Started. *React Native & Expo Architecture*. Available online: [https://docs.onspace.ai/getting-started](https://docs.onspace.ai/getting-started) [Accessed August 19, 2026].
- [3] Expo Documentation. *Expo SDK 54 & React Native 0.81*. Available online: [https://docs.expo.dev/](https://docs.expo.dev/) [Accessed August 19, 2026].
- [4] OnSpace AI Integration Guide. *GitHub Bidirectional Sync*. Available online: [https://docs.onspace.ai/integrations/github-integration](https://docs.onspace.ai/integrations/github-integration) [Accessed August 19, 2026].
- [5] OnSpace AI Blog. *How to Download Android APK from OnSpace AI*. Available online: [https://www.onspace.ai/blog/download-android-apk](https://www.onspace.ai/blog/download-android-apk) [Accessed August 19, 2026].
- [6] Software Mansion. *React Native Reanimated Repository & License*. Available online: [https://github.com/software-mansion/react-native-reanimated](https://github.com/software-mansion/react-native-reanimated).
- [7] Jesper Lekland. *react-native-svg-charts Repository & License*. Available online: [https://github.com/JesperLekland/react-native-svg-charts].
- [8] Chart Kit. *React Native Chart Kit Repository & License*. Available online: [https://github.com/chart-kit/react-native-chart-kit].
- [9] NPM. *react-native-gifted-charts Package & License*. Available online: [https://www.npmjs.com/package/react-native-gifted-charts].
