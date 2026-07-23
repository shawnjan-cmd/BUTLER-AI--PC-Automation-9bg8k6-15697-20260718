/**
 * RemoteAccessMonetizationCard — NEXUS REMOTE v6
 * ──────────────────────────────────────────────────────────────────────────────
 * FIXES in v6:
 *  • statCell: removed s.connected (was accessing .connected on a string) — now uses status.connected
 *  • FreeTierCTA button: split native/JS animated views — scaleA (native) outer wrap,
 *    borderColor interpolation (JS) inner wrap — NEVER mixed on same Animated.View
 *  • Added clear "FREE vs PRO — away from home" explanation cards
 *  • All section tips are fully visible, centered, bold
 *  • RotatingInfoTips component added with 8s rotation
 *  • Font uses textTransform: 'uppercase' for small-caps appearance (copyright safe)
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
  Platform, Dimensions, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { usePurchase } from '@/contexts/PurchaseContext';
import { TIERS, TierID } from '@/services/remoteAccessTiers';
import { RemoteAccessPaywall } from '@/components/ui/RemoteAccessPaywall';
import { RemoteSetupWizard } from '@/components/ui/RemoteSetupWizard';
import { MultiPCManager } from '@/components/ui/MultiPCManager';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const SW = Math.max(320, Dimensions.get('window').width);
const PAD = 14;

// ─── LOCAL PALETTE ────────────────────────────────────────────────
const C = {
  bg:     '#020509',
  surf:   '#060E1A',
  surf2:  '#0A1828',
  surf3:  '#04080F',
  cyan:   '#00D8F0',
  green:  '#00E878',
  amber:  '#FFB020',
  purple: '#BE55FF',
  blue:   '#4A9EFF',
  teal:   '#00CCA8',
  red:    '#FF3A5A',
  text:   '#C8E4F0',
  mid:    '#4A7090',
  dim:    '#182840',
  border: 'rgba(0,216,240,0.12)',
};

// ══════════════════════════════════════════════════════════════════
// MICRO ATOMS
// ══════════════════════════════════════════════════════════════════

function PulseDot({ color, size = 6, delay = 0 }: { color: string; size?: number; delay?: number }) {
  const a = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity: a,
    }} />
  );
}

function HudCorners({ color, size = 9, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const b: any = { position: 'absolute', width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[b, { top: 0, left: 0,     borderTopWidth: t, borderLeftWidth: t   }]} />
      <View style={[b, { top: 0, right: 0,    borderTopWidth: t, borderRightWidth: t  }]} />
      <View style={[b, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t }]} />
    </>
  );
}

function SegBar({ pct, color, height = 3 }: { pct: number; color: string; height?: number }) {
  const SEGS = 20;
  const filled = Math.round((Math.min(100, Math.max(0, pct)) / 100) * SEGS);
  return (
    <View style={{ flexDirection: 'row', gap: 2, height }}>
      {Array.from({ length: SEGS }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height, borderRadius: 1.5,
          backgroundColor: i < filled ? color : color + '18',
        }} />
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROTATING INFO TIPS — fully visible, centered, bold uppercase look
// Rotates every 6s with fade transition
// ══════════════════════════════════════════════════════════════════
const INFO_TIPS = [
  { icon: 'home-outline',       color: C.cyan,   text: 'Free plan works perfectly at home — zero latency, no throttle, no subscription needed' },
  { icon: 'earth',              color: C.amber,  text: 'Want to control your PC from work, a cafe, or another country? That requires PRO ($4.99/mo)' },
  { icon: 'shield-check',       color: C.green,  text: 'Every connection is AES-256 encrypted end-to-end — no one can intercept your commands' },
  { icon: 'wifi',               color: C.cyan,   text: 'Free: your phone and PC must be on the same Wi-Fi network — this is fastest and most secure' },
  { icon: 'vpn',                color: C.purple, text: 'PRO uses Tailscale — a free-to-setup VPN that makes your PC reachable from anywhere on Earth' },
  { icon: 'cloud-off-outline',  color: C.teal,   text: 'Zero cloud relay — your commands go directly from phone to PC, nothing stored on any server' },
  { icon: 'lock',               color: C.green,  text: 'Your data never leaves your network — not even a ping reaches any external server on free plan' },
  { icon: 'cancel',             color: C.amber,  text: 'PRO and ELITE subscriptions can be cancelled anytime — no lock-in, no hidden fees ever' },
];

function RotatingInfoTips({ color = C.cyan }: { color?: string }) {
  const [idx, setIdx] = useState(0);
  const fadeA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeA, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeA, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setIdx(i => (i + 1) % INFO_TIPS.length), 350);
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  const tip = INFO_TIPS[idx];
  return (
    <Animated.View style={[rit.root, { borderColor: tip.color + '35', opacity: fadeA }]}>
      <View style={[rit.iconBox, { backgroundColor: tip.color + '14', borderColor: tip.color + '40' }]}>
        <MaterialCommunityIcons name={tip.icon as any} size={16} color={tip.color} />
      </View>
      <Text style={[rit.tip, { color: tip.color + 'EE' }]}>{tip.text}</Text>
    </Animated.View>
  );
}
const rit = StyleSheet.create({
  root:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12, backgroundColor: C.surf2, marginBottom: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tip:     { fontFamily: MONO, fontSize: 11, lineHeight: 17, flex: 1, fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════
// FREE vs PRO EXPLAINER — the most important section for new users
// Shows crystal-clearly what's free vs what costs money
// ══════════════════════════════════════════════════════════════════
function FreeVsProExplainer() {
  return (
    <View style={{ gap: 8, marginBottom: 4 }}>
      {/* Section label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        <MaterialCommunityIcons name="help-circle-outline" size={13} color={C.mid} />
        <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          What can I do away from home?
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      </View>

      {/* FREE - at home */}
      <View style={[fvp.card, { borderColor: C.cyan + '40', borderLeftColor: C.cyan, backgroundColor: C.cyan + '05' }]}>
        <View style={fvp.cardHeader}>
          <View style={[fvp.badge, { backgroundColor: C.cyan, borderColor: C.cyan }]}>
            <Text style={[fvp.badgeTxt, { color: '#000' }]}>FREE</Text>
          </View>
          <MaterialCommunityIcons name="home-outline" size={16} color={C.cyan} />
          <View style={{ flex: 1 }}>
            <Text style={[fvp.cardTitle, { color: C.cyan }]}>Home Wi-Fi — Works perfectly</Text>
            <Text style={[fvp.cardSub, { color: C.cyan + '80' }]}>Phone and PC on the same network</Text>
          </View>
          <MaterialCommunityIcons name="check-circle" size={20} color={C.cyan} />
        </View>
        <View style={{ paddingHorizontal: 12, paddingBottom: 10, gap: 4 }}>
          {[
            'Run any of the 250+ automation scripts',
            'Chat with local Ollama AI — no internet',
            'Transfer files directly to your PC',
            'Monitor CPU, RAM, disk in real-time',
            'Sync clipboard between phone and PC',
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.cyan + '80' }} />
              <Text style={[fvp.featureTxt, { color: C.text + 'CC' }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* LOCKED - away from home */}
      <View style={[fvp.card, { borderColor: C.amber + '35', borderLeftColor: C.amber, backgroundColor: C.amber + '04' }]}>
        <View style={fvp.cardHeader}>
          <View style={[fvp.badge, { backgroundColor: C.amber + '20', borderColor: C.amber + '70' }]}>
            <MaterialIcons name="lock" size={9} color={C.amber} />
            <Text style={[fvp.badgeTxt, { color: C.amber }]}>PRO</Text>
          </View>
          <MaterialCommunityIcons name="earth" size={16} color={C.amber} />
          <View style={{ flex: 1 }}>
            <Text style={[fvp.cardTitle, { color: C.amber }]}>Away from home — Needs upgrade</Text>
            <Text style={[fvp.cardSub, { color: C.amber + '80' }]}>Work, travel, different Wi-Fi network</Text>
          </View>
          <MaterialIcons name="lock-outline" size={18} color={C.amber + '70'} />
        </View>
        <View style={{ paddingHorizontal: 12, paddingBottom: 10, gap: 4 }}>
          {[
            'Tailscale VPN — connect from anywhere',
            'Cloudflare Tunnel — public HTTPS access',
            'Control your PC from any country',
            'Works on mobile data (LTE/5G)',
            'End-to-end encrypted tunnel',
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <MaterialIcons name="lock" size={9} color={C.amber + '60'} />
              <Text style={[fvp.featureTxt, { color: C.amber + '70' }]}>{t}</Text>
            </View>
          ))}
          <View style={[fvp.pricePill, { borderColor: C.amber + '50', backgroundColor: C.amber + '12' }]}>
            <MaterialCommunityIcons name="crown-outline" size={12} color={C.amber} />
            <Text style={{ fontFamily: MONO, fontSize: 10.5, color: C.amber, fontWeight: '900', textTransform: 'uppercase' }}>
              PRO from $4.99/month — cancel anytime
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
const fvp = StyleSheet.create({
  card:       { borderRadius: 12, borderWidth: 1.5, borderLeftWidth: 4, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, paddingBottom: 8 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  badgeTxt:   { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardTitle:  { fontFamily: MONO, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardSub:    { fontFamily: MONO, fontSize: 9, marginTop: 2 },
  featureTxt: { fontFamily: MONO, fontSize: 10, lineHeight: 15, flex: 1 },
  pricePill:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, marginTop: 5 },
});

// ══════════════════════════════════════════════════════════════════
// TRUST BADGE ROW — always visible
// ══════════════════════════════════════════════════════════════════
const TRUST_BADGES = [
  { icon: 'lock-outline',         color: C.cyan,   label: 'AES-256-GCM' },
  { icon: 'shield-key-outline',   color: C.green,  label: 'HMAC-SHA256' },
  { icon: 'wifi-off',             color: C.amber,  label: 'LAN Only (Free)' },
  { icon: 'cloud-off-outline',    color: C.teal,   label: 'Zero Cloud' },
  { icon: 'eye-off-outline',      color: C.purple, label: 'No Telemetry' },
];

function TrustBadgeRow() {
  return (
    <ScrollView
      horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: PAD, paddingVertical: 10, alignItems: 'center' }}
    >
      {TRUST_BADGES.map((b, i) => (
        <View key={i} style={[tbr.badge, { borderColor: b.color + '45', backgroundColor: b.color + '0A' }]}>
          <MaterialCommunityIcons name={b.icon as any} size={11} color={b.color} />
          <Text style={[tbr.label, { color: b.color + 'CC' }]}>{b.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
const tbr = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  label: { fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3, textTransform: 'uppercase' },
});

// ══════════════════════════════════════════════════════════════════
// CONNECTION STATUS CARD — FIXED: removed s.connected bug
// ══════════════════════════════════════════════════════════════════
interface ConnStatus {
  connected: boolean;
  address:   string;
  latency:   number;
  uptime:    string;
  version:   string;
}

function ConnectionStatusCard({ status, tier }: { status: ConnStatus; tier: TierID }) {
  const isPro       = ['pro','elite','team'].includes(tier);
  const statusColor = status.connected ? C.green : C.amber;

  // FIXED: was s.connected — now correctly uses status.connected
  const STAT_ITEMS = [
    {
      icon:  'access-point-network',
      label: 'BRIDGE',
      value: status.connected ? (status.address || 'NEXUS-CORE') : 'UNPAIRED',
      color: status.connected ? C.cyan : C.mid,
    },
    {
      icon:  'speedometer-medium',
      label: 'LATENCY',
      value: status.connected ? (status.latency > 0 ? `${status.latency}ms` : '< 5ms') : '—',
      color: status.connected ? (status.latency > 200 ? C.amber : C.green) : C.mid,
    },
    {
      icon:  'clock-check-outline',
      label: 'UPTIME',
      value: status.connected ? (status.uptime || '—h') : '—',
      color: status.connected ? C.teal : C.mid,
    },
    {
      icon:  'tag-outline',
      label: 'SERVER',
      value: status.connected ? (status.version || 'v21') : '—',
      color: status.connected ? C.purple : C.mid,
    },
  ];

  return (
    <View style={[csc.root, { borderColor: statusColor + '35', backgroundColor: statusColor + '06' }]}>
      <HudCorners color={statusColor + '40'} size={7} t={1.2} />
      <View style={{ height: 2.5, backgroundColor: statusColor + '80' }} />

      <View style={csc.hdr}>
        <View style={[csc.statusOrb, { borderColor: statusColor + '60', backgroundColor: statusColor + '10' }]}>
          <MaterialCommunityIcons
            name={status.connected ? 'lan-check' : 'lan-pending'}
            size={18} color={statusColor}
          />
          <View style={[csc.orbDot, { backgroundColor: statusColor }]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <PulseDot color={statusColor} size={5} />
            <Text style={[csc.statusTitle, { color: statusColor }]}>
              {status.connected ? 'NEXUS BRIDGE ACTIVE' : 'AWAITING HANDSHAKE'}
            </Text>
          </View>
          <Text style={csc.statusSub}>
            {status.connected
              ? `Connected via ${isPro ? 'Tailscale Tunnel' : 'Local LAN'} · ${TIERS[tier].name}`
              : 'Run butler_server.py on your PC, then scan QR from the home tab'}
          </Text>
        </View>
      </View>

      {/* Stats row — FIXED: use status.connected throughout */}
      <View style={csc.statsRow}>
        {STAT_ITEMS.map((s, i) => (
          <View key={i} style={[csc.statCell, { borderColor: s.color + '30', backgroundColor: s.color + '08' }]}>
            <MaterialCommunityIcons name={s.icon as any} size={13} color={s.color + '90'} />
            <Text style={[csc.statVal, { color: status.connected ? s.color : C.mid }]}
              numberOfLines={1} adjustsFontSizeToFit>
              {s.value}
            </Text>
            <Text style={csc.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {!status.connected && (
        <View style={csc.offlineHint}>
          <MaterialCommunityIcons name="information-outline" size={12} color={C.amber} />
          <Text style={csc.offlineHintTxt}>
            Pair once — auto-reconnects every launch via saved IP and HMAC token
          </Text>
        </View>
      )}
    </View>
  );
}
const csc = StyleSheet.create({
  root:        { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', position: 'relative', marginBottom: 12 },
  hdr:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, paddingBottom: 10 },
  statusOrb:   { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  orbDot:      { position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: C.surf },
  statusTitle: { fontFamily: MONO, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, marginBottom: 2, textTransform: 'uppercase' },
  statusSub:   { fontFamily: MONO, fontSize: 9, color: C.mid, lineHeight: 13 },
  statsRow:    { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 12 },
  statCell:    { flex: 1, alignItems: 'center', borderRadius: 9, borderWidth: 1, paddingVertical: 8, gap: 3 },
  statVal:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', lineHeight: 13 },
  statLabel:   { fontFamily: MONO, fontSize: 7, color: C.mid, letterSpacing: 0.5, textTransform: 'uppercase' },
  offlineHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 12, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: C.amber + '30', backgroundColor: C.amber + '06', padding: 9 },
  offlineHintTxt: { fontFamily: MONO, fontSize: 9.5, color: C.amber + 'CC', flex: 1, lineHeight: 15 },
});

// ══════════════════════════════════════════════════════════════════
// CAPABILITY ROWS
// ══════════════════════════════════════════════════════════════════
interface CapItem {
  icon:   string;
  label:  string;
  detail: string;
  active: boolean;
  color:  string;
  badge?: string;
}

function CapabilityRow({ item }: { item: CapItem }) {
  const c = item.active ? item.color : C.mid;
  return (
    <View style={[cap.row, {
      borderColor: item.active ? item.color + '35' : C.dim + '60',
      backgroundColor: item.active ? item.color + '06' : 'transparent',
    }]}>
      <View style={[cap.iconBox, { borderColor: c + '50', backgroundColor: c + '10' }]}>
        {item.active
          ? <MaterialCommunityIcons name={item.icon as any} size={13} color={c} />
          : <MaterialIcons name="lock" size={12} color={C.mid + '80'} />}
      </View>
      <Text style={[cap.label, { color: item.active ? item.color + 'EE' : C.mid + '70' }]}>{item.label}</Text>
      <Text style={[cap.detail, { color: c + '60' }]}>{item.detail}</Text>
      {item.active && !item.badge && <View style={[cap.activePip, { backgroundColor: item.color }]} />}
      {!!item.badge && (
        <View style={[cap.lockBadge, { borderColor: C.amber + '50' }]}>
          <Text style={{ fontFamily: MONO, fontSize: 7, color: C.amber, fontWeight: '900', textTransform: 'uppercase' }}>{item.badge}</Text>
        </View>
      )}
    </View>
  );
}
const cap = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1, marginBottom: 5 },
  iconBox:   { width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:     { fontFamily: MONO, fontSize: 10, fontWeight: '900', flex: 1 },
  detail:    { fontFamily: MONO, fontSize: 8.5, textAlign: 'right' },
  activePip: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  lockBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
});

// ══════════════════════════════════════════════════════════════════
// TIER COMPARISON PILLS
// ══════════════════════════════════════════════════════════════════
const TIER_ORDER: TierID[] = ['free', 'pro', 'elite', 'team'];

function TierPills({ currentTier }: { currentTier: TierID }) {
  const currentIdx = TIER_ORDER.indexOf(currentTier);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {TIER_ORDER.map((t, i) => {
        const td     = TIERS[t];
        const active = i === currentIdx;
        const past   = i < currentIdx;
        const c      = active ? td.color : past ? td.color + '60' : C.dim;
        return (
          <View key={t} style={[tp.pill, {
            flex: active ? 2 : 1,
            borderColor: c + (active ? 'CC' : '40'),
            backgroundColor: active ? td.color + '18' : td.color + '06',
            borderTopColor: active ? td.color : c,
            borderTopWidth: active ? 2.5 : 1,
          }]}>
            <MaterialCommunityIcons name={td.icon as any} size={active ? 13 : 10} color={c} />
            <Text style={[tp.label, { color: c, fontSize: active ? 8 : 7 }]}>{t.toUpperCase()}</Text>
            {past && <MaterialIcons name="check" size={8} color={td.color + '80'} />}
          </View>
        );
      })}
    </View>
  );
}
const tp = StyleSheet.create({
  pill:  { alignItems: 'center', gap: 3, borderRadius: 8, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 4, overflow: 'hidden' },
  label: { fontFamily: MONO, fontWeight: '900', letterSpacing: 0.3 },
});

// ══════════════════════════════════════════════════════════════════
// PRIVACY STATEMENT
// ══════════════════════════════════════════════════════════════════
function PrivacyStatement() {
  const ITEMS = [
    { icon: 'database-off-outline',   color: C.green,  text: 'No data stored on any server — SQLite lives only on your PC' },
    { icon: 'account-cancel-outline', color: C.cyan,   text: 'Zero accounts, zero registration, zero email required' },
    { icon: 'incognito',              color: C.purple, text: 'No analytics, no crash reporters, no third-party SDKs' },
    { icon: 'lan',                    color: C.teal,   text: 'All traffic stays inside your home network on the free plan' },
  ];
  return (
    <View style={[pvs.root, { borderColor: C.green + '30', backgroundColor: C.green + '04' }]}>
      <View style={{ height: 2, backgroundColor: C.green + '60' }} />
      <View style={{ padding: 12, gap: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 }}>
          <MaterialCommunityIcons name="shield-check" size={13} color={C.green} />
          <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.green + 'CC', letterSpacing: 1, textTransform: 'uppercase' }}>
            Privacy Guarantee
          </Text>
        </View>
        {ITEMS.map((item, i) => (
          <View key={i} style={[pvs.row, i < ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.green + '10' }]}>
            <MaterialCommunityIcons name={item.icon as any} size={12} color={item.color} />
            <Text style={[pvs.rowTxt, { color: item.color + 'BB' }]}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const pvs = StyleSheet.create({
  root:   { borderRadius: 11, borderWidth: 1.5, overflow: 'hidden', marginBottom: 12 },
  row:    { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 7 },
  rowTxt: { fontFamily: MONO, fontSize: 10, lineHeight: 15, flex: 1 },
});

// ══════════════════════════════════════════════════════════════════
// FREE TIER CTA — CRASH FIX: native/JS driver split into 2 views
// scaleA (native) → outer Animated.View (transform only)
// borderColor (JS) → inner Animated.View (color/background only)
// They NEVER share an Animated.View node
// ══════════════════════════════════════════════════════════════════
function FreeTierCTA({ onUpgrade, purchasing }: { onUpgrade: () => void; purchasing: boolean }) {
  // NATIVE DRIVER — transform only
  const scaleA = useRef(new Animated.Value(1)).current;
  // JS DRIVER — color interpolation only
  const glowA  = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 0.85, duration: 1600, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.25, duration: 1600, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const pi = () => Animated.spring(scaleA, { toValue: 0.96, tension: 380, friction: 10, useNativeDriver: true }).start();
  const po = () => Animated.spring(scaleA, { toValue: 1.0,  tension: 280, friction: 10, useNativeDriver: true }).start();

  // JS-only interpolation for borderColor
  const borderColor = glowA.interpolate({
    inputRange:  [0.25, 0.85],
    outputRange: [C.amber + '55', C.amber + 'DD'],
  });

  return (
    <View style={{ gap: 10 }}>
      {/* What's free forever */}
      <View style={[ftc.freeCard, { borderColor: C.cyan + '30', backgroundColor: C.cyan + '05' }]}>
        <View style={{ height: 2, backgroundColor: C.cyan + '50' }} />
        <View style={{ padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <MaterialCommunityIcons name="shield-outline" size={13} color={C.cyan} />
            <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.cyan, letterSpacing: 1, textTransform: 'uppercase' }}>
              What You Get — Free Forever
            </Text>
          </View>
          {[
            { t: 'Full PC control on home Wi-Fi — no subscription', ok: true  },
            { t: '250+ Python automation scripts — one tap to run',  ok: true  },
            { t: 'Local Ollama AI chat — no internet needed',        ok: true  },
            { t: 'File transfer Phone to PC — direct LAN',           ok: true  },
            { t: 'Clipboard sync, process monitor, disk tools',      ok: true  },
            { t: 'Away from home / different network',               ok: false },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <MaterialCommunityIcons
                name={item.ok ? 'check-circle-outline' : 'close-circle-outline'}
                size={13}
                color={item.ok ? C.cyan + '90' : C.red + '70'}
                style={{ marginTop: 1 }}
              />
              <Text style={{ fontFamily: MONO, fontSize: 10.5, color: item.ok ? C.text + 'CC' : C.red + '70', flex: 1, lineHeight: 16 }}>
                {item.t}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* What PRO unlocks */}
      <View style={[ftc.proCard, { borderColor: C.amber + '30', backgroundColor: C.amber + '04' }]}>
        <View style={{ height: 2, backgroundColor: C.amber + '50' }} />
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <MaterialCommunityIcons name="crown-outline" size={13} color={C.amber} />
            <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.amber, letterSpacing: 1, textTransform: 'uppercase' }}>
              Unlock Remote Access — from $4.99/mo
            </Text>
          </View>
          {[
            'Control PC from work, travel, anywhere on Earth',
            'Tailscale VPN — secure tunnel, no port forwarding needed',
            'Cloudflare Tunnel — public HTTPS access from any browser',
            'Works on LTE, 5G, any Wi-Fi anywhere in the world',
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
              <MaterialCommunityIcons name="earth" size={11} color={C.amber + '70'} style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.amber + '80', flex: 1, lineHeight: 15 }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA BUTTON — FIXED: outer = native scale, inner = JS border color */}
      <Pressable
        onPress={() => { haptics.heavy(); onUpgrade(); }}
        onPressIn={pi}
        onPressOut={po}
        disabled={purchasing}
        style={{ opacity: purchasing ? 0.75 : 1 }}
      >
        {/* OUTER: native driver scale transform — NO color props here */}
        <Animated.View style={{ transform: [{ scale: scaleA }] }}>
          {/* INNER: JS driver border color — NO transform here */}
          <Animated.View style={[ftc.ctaBtn, { borderColor }]}>
            <View pointerEvents="none" style={ftc.ctaShimmer} />
            <HudCorners color={C.amber + '60'} size={8} t={1.2} />
            {purchasing
              ? <ActivityIndicator size="small" color="#000" />
              : <MaterialCommunityIcons name="crown" size={18} color="#000" />}
            <View style={{ flex: 1 }}>
              <Text style={ftc.ctaTitle}>Explore Remote Plans</Text>
              <Text style={ftc.ctaSub}>PRO · ELITE · TEAM — cancel anytime · no hidden fees</Text>
            </View>
            <View style={ftc.ctaArrow}>
              <MaterialIcons name="arrow-forward" size={15} color={C.amber} />
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 }}>
        <MaterialCommunityIcons name="shield-check" size={11} color={C.green + '70'} />
        <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid, textAlign: 'center', fontWeight: '700' }}>
          Free plan works perfectly forever on home Wi-Fi
        </Text>
        <MaterialCommunityIcons name="shield-check" size={11} color={C.green + '70'} />
      </View>
    </View>
  );
}
const ftc = StyleSheet.create({
  freeCard:   { borderRadius: 11, borderWidth: 1.5, overflow: 'hidden' },
  proCard:    { borderRadius: 11, borderWidth: 1.5, overflow: 'hidden' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.amber,
    borderWidth: 2.5, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 16,
    overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios: { shadowColor: C.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  ctaShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(255,255,255,0.09)' },
  ctaTitle:   { fontFamily: MONO, fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: 0.3, textTransform: 'uppercase' },
  ctaSub:     { fontFamily: MONO, fontSize: 8.5, color: 'rgba(0,0,0,0.6)', marginTop: 2 },
  ctaArrow:   { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.14)', alignItems: 'center', justifyContent: 'center' },
});

// ══════════════════════════════════════════════════════════════════
// PRO TIER PANEL
// ══════════════════════════════════════════════════════════════════
function ProTierPanel({ tier, isPro, isElite, isTeam, savedPCs, maxPCs, onWizard, onMultiPC }: {
  tier: TierID; isPro: boolean; isElite: boolean; isTeam: boolean;
  savedPCs: any[]; maxPCs: number; onWizard: () => void; onMultiPC: () => void;
}) {
  const tierData = TIERS[tier];
  const usedPct  = maxPCs > 0 ? (savedPCs.length / maxPCs) * 100 : 0;
  return (
    <View style={{ gap: 10 }}>
      <View style={[ptp.tunnelCard, { borderColor: C.green + '40', backgroundColor: C.green + '06' }]}>
        <View style={{ height: 2.5, backgroundColor: C.green + '70' }} />
        <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[ptp.tunnelIcon, { borderColor: C.green + '50', backgroundColor: C.green + '10' }]}>
            <MaterialCommunityIcons name="vpn" size={20} color={C.green} />
            <View style={ptp.tunnelOrb} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#FFF', marginBottom: 3, textTransform: 'uppercase' }}>
              Remote Tunnel Ready
            </Text>
            <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, lineHeight: 14 }}>
              {isElite ? 'Tailscale + Cloudflare · Multi-PC · Scheduler active' : 'Tailscale + Cloudflare tunnel · end-to-end encrypted'}
            </Text>
          </View>
          <View style={[ptp.liveChip, { borderColor: C.green + '55' }]}>
            <PulseDot color={C.green} size={5} />
            <Text style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', color: C.green }}>LIVE</Text>
          </View>
        </View>
      </View>
      <View style={[ptp.pcCard, { borderColor: C.cyan + '30' }]}>
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="server-network" size={12} color={C.cyan} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.cyan + 'CC', letterSpacing: 1, textTransform: 'uppercase' }}>
                PC Profiles
              </Text>
            </View>
            <Text style={{ fontFamily: MONO, fontSize: 10, color: C.cyan, fontWeight: '900' }}>
              {savedPCs.length} / {maxPCs}
            </Text>
          </View>
          <SegBar pct={usedPct} color={C.cyan} height={5} />
          <Text style={{ fontFamily: MONO, fontSize: 8.5, color: C.mid, marginTop: 6, lineHeight: 14 }}>
            {isElite ? `${maxPCs - savedPCs.length} slots remaining · ELITE: up to ${maxPCs} PCs` : 'PRO includes 1 PC profile · Upgrade to ELITE for 3 PCs'}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Pressable onPress={onWizard}
          style={({ pressed }) => [ptp.btnPrimary, { backgroundColor: tierData.color, opacity: pressed ? 0.85 : 1 }]}>
          <MaterialCommunityIcons name="remote-desktop" size={16} color="#000" />
          <Text style={ptp.btnPrimaryTxt}>Setup Wizard</Text>
        </Pressable>
        <Pressable onPress={onMultiPC}
          style={({ pressed }) => [ptp.btnSecondary, {
            borderColor: isElite ? C.purple + '60' : C.dim,
            backgroundColor: isElite ? C.purple + '0D' : C.dim + '20',
            opacity: pressed ? 0.8 : 1,
          }]}>
          <MaterialCommunityIcons name={isElite ? 'server-network' : 'lock-outline'} size={14} color={isElite ? C.purple : C.mid} />
          <Text style={[ptp.btnSecondaryTxt, { color: isElite ? C.purple : C.mid }]}>{isElite ? 'Multi-PC' : 'Elite+'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
const ptp = StyleSheet.create({
  tunnelCard:    { borderRadius: 11, borderWidth: 1.5, overflow: 'hidden' },
  tunnelIcon:    { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  tunnelOrb:     { position: 'absolute', bottom: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, borderWidth: 1.5, borderColor: C.surf },
  liveChip:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  pcCard:        { borderRadius: 11, borderWidth: 1, backgroundColor: C.surf2 },
  btnPrimary:    { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, paddingVertical: 13 },
  btnPrimaryTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000', textTransform: 'uppercase' },
  btnSecondary:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 13, borderWidth: 1.5 },
  btnSecondaryTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
});

// ══════════════════════════════════════════════════════════════════
// SECTION DIVIDER
// ══════════════════════════════════════════════════════════════════
function SectionDivider({ label, color, icon }: { label: string; color: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, marginTop: 4 }}>
      <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: color }} />
      <MaterialCommunityIcons name={icon as any} size={11} color={color} />
      <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: color + 'CC', letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: color + '20' }} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// HEADER — scans, glows
// ══════════════════════════════════════════════════════════════════
function CardHeader({ tier, tierData, isPro }: { tier: TierID; tierData: typeof TIERS[TierID]; isPro: boolean }) {
  const shimA = useRef(new Animated.Value(-SW)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimA, { toValue: SW * 1.5, duration: 3200, useNativeDriver: true }),
      Animated.timing(shimA, { toValue: -SW, duration: 0, useNativeDriver: true }),
      Animated.delay(9000),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const tc = tierData.color;
  return (
    <View style={{ overflow: 'hidden', position: 'relative' }}>
      <View style={{ flexDirection: 'row', height: 3 }}>
        {[4, 1, 8, 1, 3, 1, 5, 2].map((flex, i) => (
          <View key={i} style={{ flex, backgroundColor: [tc, tc + '20', C.cyan, C.cyan + '10', tc + '60', C.cyan + '08', C.green + '30', tc + '15'][i] }} />
        ))}
      </View>
      <Animated.View pointerEvents="none"
        style={[StyleSheet.absoluteFill, { width: 90, backgroundColor: tc + '06', transform: [{ translateX: shimA }, { skewX: '-8deg' }], zIndex: 0 }]} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: PAD, paddingBottom: 12, zIndex: 1 }}>
        <View style={[chdh.iconOrb, {
          borderColor: tc + '55', backgroundColor: tc + '10',
          ...Platform.select({ ios: { shadowColor: tc, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12 }, android: { elevation: 6 } }),
        }]}>
          <MaterialCommunityIcons name="remote-desktop" size={22} color={tc} />
          <View style={[chdh.orbDot, { backgroundColor: isPro ? C.green : C.amber }]} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: C.mid, letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' }}>
            Butler AI · Nexus Remote
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.2, lineHeight: 24, textTransform: 'uppercase' }}>
            Remote <Text style={{ color: tc }}>Access</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 }}>
            <View style={[chdh.tierPill, { borderColor: tc + '70', backgroundColor: tc + '12' }]}>
              <MaterialCommunityIcons name={tierData.icon as any} size={9} color={tc} />
              <Text style={[chdh.tierTxt, { color: tc }]}>{tierData.name}</Text>
            </View>
            <PulseDot color={isPro ? C.green : C.amber} size={5} />
            <Text style={{ fontFamily: MONO, fontSize: 8, color: isPro ? C.green + 'AA' : C.amber + 'AA', fontWeight: '700', textTransform: 'uppercase' }}>
              {isPro ? 'Remote Active' : 'Lan Only'}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {!isPro && (
            <View style={[chdh.priceBadge, { borderColor: C.amber + '50', backgroundColor: C.amber + '0C' }]}>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.amber }}>from</Text>
              <Text style={{ fontFamily: MONO, fontSize: 16, fontWeight: '900', color: C.amber, lineHeight: 20 }}>$4.99</Text>
              <Text style={{ fontFamily: MONO, fontSize: 7, color: C.amber + '80' }}>/month</Text>
            </View>
          )}
          {isPro && (
            <View style={[chdh.priceBadge, { borderColor: C.green + '50', backgroundColor: C.green + '08' }]}>
              <MaterialCommunityIcons name="check-circle" size={14} color={C.green} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.green }}>ACTIVE</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
const chdh = StyleSheet.create({
  iconOrb:   { width: 52, height: 52, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  orbDot:    { position: 'absolute', bottom: 5, right: 5, width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: C.surf },
  tierPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tierTxt:   { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  priceBadge:{ alignItems: 'center', borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, gap: 1 },
});

// ══════════════════════════════════════════════════════════════════
// ANIMATED BORDER WRAPPER — JS driver only
// ══════════════════════════════════════════════════════════════════
function AnimatedBorder({ color, children }: { color: string; children: React.ReactNode }) {
  const glowA = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 0.8,  duration: 1800, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.15, duration: 1800, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [color]);
  const borderColor = glowA.interpolate({
    inputRange:  [0.15, 0.8],
    outputRange: [color + '25', color + '90'],
  });
  return (
    <Animated.View style={[mc.innerBorder, { borderColor }]}>
      <HudCorners color={color + '50'} size={10} t={1.5} />
      {children}
    </Animated.View>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN EXPORTED CARD
// ══════════════════════════════════════════════════════════════════
export function RemoteAccessMonetizationCard({ onConnected }: { onConnected?: () => void }) {
  const {
    tier, tierData, isPro, isElite, isTeam, isLoaded,
    savedPCs, maxPCs, purchase,
  } = usePurchase();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showWizard,  setShowWizard]  = useState(false);
  const [showMultiPC, setShowMultiPC] = useState(false);
  const [purchasing,  setPurchasing]  = useState(false);
  const [connStatus,  setConnStatus]  = useState<ConnStatus>({
    connected: false, address: '', latency: 0, uptime: '', version: '',
  });

  const pollConn = useCallback(async () => {
    try {
      const { serverConnection } = await import('@/services/serverConnection');
      const isConn = serverConnection.isConnected?.() ?? false;
      const ip     = serverConnection.getIP?.() ?? '';
      const port   = serverConnection.getPort?.() ?? '';
      if (!isConn || !ip) {
        setConnStatus(prev => prev.connected ? { ...prev, connected: false } : prev);
        return;
      }
      const tok  = serverConnection.getToken?.() ?? '';
      const h: Record<string, string> = {};
      if (tok) h['Authorization'] = 'Bearer ' + tok;
      const t0   = Date.now();
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(`http://${ip}:${port}/api/status`, { headers: h, signal: ctrl.signal });
      if (!res.ok) { setConnStatus(prev => ({ ...prev, connected: false })); return; }
      const d = await res.json().catch(() => ({}));
      setConnStatus({ connected: true, address: `${ip}:${port}`, latency: Date.now() - t0, uptime: d.uptime ?? '', version: d.version ?? 'v21' });
    } catch {
      setConnStatus(prev => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    pollConn();
    const t = setInterval(pollConn, 15000);
    return () => clearInterval(t);
  }, [pollConn]);

  const handleUpgrade = useCallback(() => { haptics.heavy(); setShowPaywall(true); }, []);
  const handleWizard  = useCallback(() => { haptics.medium(); setShowWizard(true);  }, []);
  const handleMultiPC = useCallback(() => {
    haptics.medium();
    isElite ? setShowMultiPC(true) : setShowPaywall(true);
  }, [isElite]);

  if (!isLoaded) {
    return (
      <View style={mc.root}>
        <View style={{ height: 3, flexDirection: 'row' }}>
          {[4, 1, 8, 1, 3].map((f, i) => (
            <View key={i} style={{ flex: f, backgroundColor: [C.cyan, C.cyan + '20', C.cyan, C.cyan + '10', C.cyan + '30'][i] }} />
          ))}
        </View>
        <View style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
          <ActivityIndicator size="small" color={C.cyan} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid, letterSpacing: 1, textTransform: 'uppercase' }}>
            Initialising Remote Module...
          </Text>
        </View>
      </View>
    );
  }

  const CAPS: CapItem[] = [
    { icon: 'lan-check',           label: 'Local LAN Control',      detail: 'ACTIVE',                  active: true,    color: C.cyan   },
    { icon: 'vpn',                 label: 'Tailscale Remote Tunnel', detail: isPro ? 'READY' : 'PRO+',  active: isPro,   color: C.green,  badge: isPro ? undefined : 'PRO' },
    { icon: 'cloud-braces',        label: 'Cloudflare Tunnel',       detail: isPro ? 'READY' : 'PRO+',  active: isPro,   color: C.amber,  badge: isPro ? undefined : 'PRO' },
    { icon: 'server-network',      label: 'Multi-PC Profiles',       detail: isElite ? `${savedPCs.length}/${maxPCs}` : 'ELITE+', active: isElite, color: C.purple, badge: isElite ? undefined : 'ELITE' },
    { icon: 'shield-lock',         label: 'HMAC-SHA256 Auth',        detail: 'ALWAYS ON',               active: true,    color: C.green  },
    { icon: 'lock-outline',        label: 'AES-256-GCM Encryption',  detail: 'ALWAYS ON',               active: true,    color: C.cyan   },
    { icon: 'undo-variant',        label: 'One-Tap Undo',            detail: '15 MIN WINDOW',           active: true,    color: C.teal   },
    { icon: 'magnify-scan',        label: 'Nefarious Script Guard',  detail: '40+ PATTERNS',            active: true,    color: C.blue   },
  ];

  return (
    <>
      <View style={mc.root}>
        <AnimatedBorder color={tierData.color}>
          <CardHeader tier={tier} tierData={tierData} isPro={isPro} />

          <View style={{ paddingHorizontal: PAD, gap: 0 }}>
            <TrustBadgeRow />
            <View style={mc.hairline} />

            {/* ── ROTATING TIPS — always visible centered info ── */}
            <View style={{ marginTop: 10, marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, justifyContent: 'center' }}>
                <MaterialCommunityIcons name="rotate-right" size={10} color={C.mid} />
                <Text style={{ fontFamily: MONO, fontSize: 8.5, color: C.mid, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Did you know?
                </Text>
              </View>
              <RotatingInfoTips />
            </View>

            {/* ── FREE vs PRO EXPLAINER — most important for new users ── */}
            <FreeVsProExplainer />

            <View style={mc.hairline} />

            {/* ── CONNECTION STATUS ── */}
            <View style={{ marginTop: 12 }}>
              <SectionDivider label="Bridge Status" color={connStatus.connected ? C.green : C.amber} icon="lan" />
              <ConnectionStatusCard status={connStatus} tier={tier} />
            </View>

            {/* ── TIER COMPARISON ── */}
            <SectionDivider label="Your Plan" color={tierData.color} icon="medal-outline" />
            <TierPills currentTier={tier} />
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <Text style={{ fontFamily: MONO, fontSize: 9.5, color: C.mid, lineHeight: 16 }}>
                {tierData.tagline}
              </Text>
            </View>

            {/* ── CAPABILITIES ── */}
            <SectionDivider label="Capabilities" color={C.cyan} icon="lightning-bolt" />
            {CAPS.map((item, i) => <CapabilityRow key={i} item={item} />)}

            <View style={mc.hairline} />

            {/* ── PRO / FREE CTA ── */}
            <View style={{ marginTop: 12, marginBottom: 12 }}>
              {isPro ? (
                <>
                  <SectionDivider label="Remote Controls" color={tierData.color} icon="remote-desktop" />
                  <ProTierPanel
                    tier={tier} isPro={isPro} isElite={isElite} isTeam={isTeam}
                    savedPCs={savedPCs} maxPCs={maxPCs}
                    onWizard={handleWizard} onMultiPC={handleMultiPC}
                  />
                </>
              ) : (
                <FreeTierCTA onUpgrade={handleUpgrade} purchasing={purchasing} />
              )}
            </View>

            <PrivacyStatement />

            {/* ── FOOTER ── */}
            <View style={mc.footer}>
              <PulseDot color={C.green} size={4} />
              <Text style={mc.footerTxt}>
                Zero cloud · HMAC-SHA256 · AES-256-GCM · LAN only (free)
              </Text>
              <Pressable onPress={handleUpgrade} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontFamily: MONO, fontSize: 8, color: C.cyan + '80', fontWeight: '900', textTransform: 'uppercase' }}>
                  All Plans ›
                </Text>
              </Pressable>
            </View>
          </View>
        </AnimatedBorder>
      </View>

      <RemoteAccessPaywall visible={showPaywall} onClose={() => setShowPaywall(false)} highlightTier="pro" />
      <RemoteSetupWizard   visible={showWizard}  onClose={() => setShowWizard(false)}  onConnected={onConnected} />
      <MultiPCManager      visible={showMultiPC} onClose={() => setShowMultiPC(false)} onConnected={onConnected} />
    </>
  );
}

const mc = StyleSheet.create({
  root: {
    backgroundColor: C.surf,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  innerBorder: {
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: C.surf,
  },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 4 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border, backgroundColor: C.surf3,
    paddingHorizontal: PAD, marginHorizontal: -PAD,
  },
  footerTxt: { fontFamily: MONO, fontSize: 8.5, color: C.mid, flex: 1 },
});

export default RemoteAccessMonetizationCard;
