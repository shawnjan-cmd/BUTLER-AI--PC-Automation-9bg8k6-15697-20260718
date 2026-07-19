/**
 * RemoteAccessMonetizationCard — NEXUS REMOTE v4
 * ────────────────────────────────────────────────────────────────
 * Unified design token system · CyberPanel wrapper · Crash-proof animations
 * All Animated.Values: single driver type, mounted guards on every loop
 * useNativeDriver: true (opacity only) — ZERO JS/native mixing
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Platform, Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { usePurchase } from '@/contexts/PurchaseContext';
import { TIERS, TierID } from '@/services/remoteAccessTiers';
import { RemoteAccessPaywall } from '@/components/ui/RemoteAccessPaywall';
import { RemoteSetupWizard } from '@/components/ui/RemoteSetupWizard';
import { MultiPCManager } from '@/components/ui/MultiPCManager';
import { CyberPanel } from '@/components/ui/CyberPanel';
import { COLOR, FONT, glow, hex } from '@/constants/tokens';
import { haptics } from '@/services/haptics';
import { logger } from '@/utils/logger';

const MONO: any = FONT.mono;
const SW = Math.max(320, Dimensions.get('window').width);

// Alias tokens to local C for minimal diff
const C = {
  bg:     COLOR.bg,
  surf:   COLOR.surf,
  surf2:  COLOR.surf2,
  cyan:   COLOR.cyan,
  green:  COLOR.green,
  amber:  COLOR.amber,
  red:    COLOR.red,
  purple: COLOR.magenta,
  blue:   COLOR.blue,
  pink:   COLOR.pink,
  mid:    COLOR.mid,
  dim:    COLOR.dim,
  text:   COLOR.text,
  border: COLOR.border,
};

// ── SAFE PULSE DOT — opacity only, native driver, mounted guard ──
function PulseDot({ color, size = 5 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.35)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ── HUD CORNER BRACKETS ───────────────────────────────────────────
function HudCorners({ color, size = 8, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const s: any = { position: 'absolute', width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[s, { top: 0, left: 0,  borderTopWidth: t, borderLeftWidth: t  }]} />
      <View style={[s, { top: 0, right: 0, borderTopWidth: t, borderRightWidth: t }]} />
      <View style={[s, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t  }]} />
      <View style={[s, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t }]} />
    </>
  );
}

// ── TIER BADGE ────────────────────────────────────────────────────
function TierBadge({ id }: { id: TierID }) {
  const t = TIERS[id];
  return (
    <View style={[tb.wrap, { borderColor: t.color + '60', backgroundColor: t.color + '12' }]}>
      <MaterialCommunityIcons name={t.icon as any} size={9} color={t.color} />
      <Text style={[tb.txt, { color: t.color }]}>{t.name.toUpperCase()}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  txt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
});

// ── FEATURE ROW ITEM ─────────────────────────────────────────────
function FeatRow({ icon, label, detail, locked, color }: {
  icon: string; label: string; detail: string; locked: boolean; color: string;
}) {
  const c = locked ? C.mid : color;
  return (
    <View style={[fr.row, { borderColor: locked ? C.dim : color + '30', backgroundColor: locked ? 'transparent' : glow(color, 6) }]}>
      <View style={[fr.iconBox, { borderColor: c + '50', backgroundColor: glow(c, 10) }]}>
        {locked
          ? <MaterialIcons name="lock" size={11} color={C.mid} />
          : <MaterialCommunityIcons name={icon as any} size={11} color={color} />}
      </View>
      <Text style={[fr.label, { color: c }]}>{label}</Text>
      <Text style={[fr.detail, { color: c + '70' }]}>{detail}</Text>
      {!locked && <View style={[fr.activeDot, { backgroundColor: color }]} />}
    </View>
  );
}
const fr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, marginBottom: 5 },
  iconBox:  { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:    { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', flex: 1 },
  detail:   { fontFamily: MONO, fontSize: 8, textAlign: 'right' },
  activeDot:{ width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
});

// ── MAIN CARD ─────────────────────────────────────────────────────
export function RemoteAccessMonetizationCard({ onConnected }: { onConnected?: () => void }) {
  const { tier, tierData, isPro, isElite, isTeam, isLoaded, savedPCs, maxPCs, purchase } = usePurchase();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showWizard,  setShowWizard]  = useState(false);
  const [showMultiPC, setShowMultiPC] = useState(false);
  const [purchasing,  setPurchasing]  = useState(false);

  useEffect(() => {
    logger.info('[RemoteAccess] mounted', `tier=${tier}`);
    return () => logger.debug('[RemoteAccess] unmounted');
  }, []);

  useEffect(() => {
    if (isLoaded) logger.info('[RemoteAccess] tier', tier);
  }, [tier, isLoaded]);

  const handleUpgrade = useCallback(() => {
    haptics.heavy();
    setShowPaywall(true);
  }, []);

  const handleQuickUpgrade = useCallback(async () => {
    haptics.heavy();
    setPurchasing(true);
    try {
      const result = await purchase('pro', false);
      if (!result.success && result.error !== 'Purchase cancelled') setShowPaywall(true);
    } catch { setShowPaywall(true); }
    finally { setPurchasing(false); }
  }, [purchase]);

  const handleWizard  = useCallback(() => { haptics.medium(); setShowWizard(true);  }, []);
  const handleMultiPC = useCallback(() => {
    haptics.medium();
    isElite ? setShowMultiPC(true) : setShowPaywall(true);
  }, [isElite]);

  if (!isLoaded) {
    return (
      <CyberPanel accentColor={C.cyan} stripe staticBorder screenWidth={SW}
        style={{ minHeight: 80, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={C.cyan} />
        <Text style={{ fontFamily: MONO, fontSize: 8, color: C.mid }}>LOADING PLANS...</Text>
      </CyberPanel>
    );
  }

  const statusColor = isPro ? C.green : C.amber;
  const tierColor   = tierData.color;

  return (
    <>
      {/* CyberPanel provides: animated border glow, HUD corners, top+bottom stripe, scanline sweep */}
      <CyberPanel
        accentColor={tierColor}
        stripe
        stripeColors={[C.cyan, C.green, tierColor, C.purple, C.pink]}
        scanline
        screenWidth={SW}
      >

        {/* ── HEADER SECTION ────────────────────────────────────── */}
        <View style={card.header}>
          {/* Icon cluster */}
          <View style={[card.iconCluster, { borderColor: tierColor + '40', backgroundColor: glow(tierColor, 8) }]}>
            <MaterialCommunityIcons name="remote-desktop" size={22} color={tierColor} />
            <View style={[card.iconDot, { backgroundColor: isPro ? C.green : C.mid }]} />
          </View>

          {/* Title + status */}
          <View style={card.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <Text style={card.title}>REMOTE ACCESS</Text>
              <TierBadge id={tier} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <PulseDot color={statusColor} size={5} />
              <Text style={[card.statusTxt, { color: statusColor }]}>
                {isPro ? 'REMOTE ACTIVE · END-TO-END ENCRYPTED' : 'LAN ONLY · UPGRADE FOR REMOTE'}
              </Text>
            </View>
            <Text style={card.tagline} numberOfLines={2}>{tierData.tagline}</Text>
          </View>
        </View>

        {/* ── TERMINAL-STYLE INFO BAR ────────────────────────────── */}
        <View style={card.infoBar}>
          {[
            { k: 'TIER',   v: tier.toUpperCase(),                     c: tierColor  },
            { k: 'TUNNEL', v: isPro ? 'ACTIVE' : 'LOCKED',            c: isPro ? C.green : C.mid },
            { k: 'ENC',    v: isPro ? 'TLS 1.3' : 'NONE',             c: isPro ? C.cyan  : C.mid },
            { k: 'DEVICES',v: `${savedPCs.length}/${maxPCs}`,          c: C.amber },
          ].map((item, i) => (
            <View key={i} style={[card.infoPill, { borderColor: item.c + '35', backgroundColor: glow(item.c, 5) }]}>
              <Text style={[card.infoPillLbl, { color: item.c + '70' }]}>{item.k}</Text>
              <Text style={[card.infoPillVal, { color: item.c }]}>{item.v}</Text>
            </View>
          ))}
        </View>

        <View style={card.divider} />

        {/* ── FEATURE LIST ─────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 9 }}>
            <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: tierColor }} />
            <Text style={[card.sectionTitle, { color: tierColor }]}>CAPABILITIES</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: tierColor + '20' }} />
          </View>
          <FeatRow icon="vpn"              label="Tailscale Tunnel"   detail={isPro?'READY':'PRO+'}   locked={!isPro}   color={C.cyan}   />
          <FeatRow icon="cloud-braces"     label="Cloudflare Zero"    detail={isPro?'ACTIVE':'PRO+'}  locked={!isPro}   color={C.amber}  />
          <FeatRow icon="server-network"   label="Multi-PC Profiles"  detail={isElite?`${savedPCs.length}/${maxPCs}`:'ELITE+'} locked={!isElite} color={C.purple} />
          <FeatRow icon="shield-lock"      label="Mutual Auth"        detail="HMAC-256"               locked={false}    color={C.green}  />
        </View>

        <View style={[card.divider, { marginTop: 4 }]} />

        {/* ── CTA SECTION ──────────────────────────────────────────── */}
        {isPro ? (
          <View style={{ flexDirection: 'row', gap: 10, padding: 14 }}>
            <Pressable onPress={handleWizard}
              style={({ pressed }) => [card.btnPrimary, { backgroundColor: tierColor, opacity: pressed ? 0.85 : 1 }]}>
              <MaterialCommunityIcons name="remote-desktop" size={15} color="#000" />
              <Text style={card.btnPrimaryTxt}>SETUP WIZARD</Text>
            </Pressable>
            <Pressable onPress={handleMultiPC}
              style={({ pressed }) => [card.btnSecondary, {
                borderColor: isElite ? C.purple + '60' : C.dim,
                backgroundColor: isElite ? glow(C.purple, 10) : 'transparent',
                opacity: pressed ? 0.8 : 1,
              }]}>
              <MaterialCommunityIcons name="server-network" size={14} color={isElite ? C.purple : C.mid} />
              <Text style={[card.btnSecondaryTxt, { color: isElite ? C.purple : C.mid }]}>
                {isElite ? 'MULTI-PC' : 'ELITE'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handleQuickUpgrade} disabled={purchasing}
            style={({ pressed }) => [card.unlockBtn, { opacity: pressed || purchasing ? 0.8 : 1 }]}>
            {/* Scan line overlay for drama */}
            <View style={card.unlockScanLine} pointerEvents="none" />
            {purchasing
              ? <ActivityIndicator size="small" color="#000" />
              : <MaterialCommunityIcons name="crown" size={18} color="#000" />}
            <View style={{ flex: 1 }}>
              <Text style={card.unlockTitle}>UNLOCK REMOTE ACCESS</Text>
              <Text style={card.unlockSub}>From $4.99/month · Cancel anytime · Tailscale &amp; Cloudflare</Text>
            </View>
            <View style={card.unlockArrow}>
              <MaterialIcons name="arrow-forward" size={16} color={C.amber} />
            </View>
          </Pressable>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <View style={card.footer}>
          <PulseDot color={C.green} size={4} />
          <Text style={card.footerTxt}>Zero cloud · LAN encrypted · HMAC-SHA256 auth</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={handleUpgrade} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[card.footerLink, { color: C.cyan + '90' }]}>ALL PLANS ›</Text>
          </Pressable>
        </View>

      </CyberPanel>

      <RemoteAccessPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        highlightTier="pro"
      />
      <RemoteSetupWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onConnected={onConnected}
      />
      <MultiPCManager
        visible={showMultiPC}
        onClose={() => setShowMultiPC(false)}
        onConnected={onConnected}
      />
    </>
  );
}

const card = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, padding: 14, paddingBottom: 12,
  },
  iconCluster: {
    width: 52, height: 52, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  iconDot: {
    position: 'absolute', bottom: 5, right: 5,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: COLOR.surf,
  },
  headerInfo: { flex: 1 },
  title:    { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.4 },
  statusTxt:{ fontFamily: MONO, fontSize: 8.5, fontWeight: '700', flex: 1 },
  tagline:  { fontFamily: MONO, fontSize: 8.5, color: COLOR.mid, lineHeight: 13, marginTop: 4 },

  // Info bar
  infoBar: {
    flexDirection: 'row', gap: 5,
    paddingHorizontal: 12, paddingBottom: 10,
  },
  infoPill: {
    flex: 1, alignItems: 'center',
    borderWidth: 1, borderRadius: 8, paddingVertical: 6, gap: 2,
    backgroundColor: COLOR.surf2,
  },
  infoPillLbl: { fontFamily: MONO, fontSize: 6.5, fontWeight: '700', letterSpacing: 0.5 },
  infoPillVal: { fontFamily: MONO, fontSize: 9, fontWeight: '900' },

  divider:     { height: StyleSheet.hairlineWidth, backgroundColor: COLOR.border, marginHorizontal: 14 },
  sectionTitle:{ fontFamily: MONO, fontSize: 8.5, fontWeight: '900', letterSpacing: 1.5 },

  // Buttons
  btnPrimary: {
    flex: 2, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    borderRadius: 12, paddingVertical: 13,
  },
  btnPrimaryTxt: { fontFamily: MONO, fontSize: 11, fontWeight: '900', color: '#000', letterSpacing: 0.3 },

  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 13, borderWidth: 1.5,
  },
  btnSecondaryTxt: { fontFamily: MONO, fontSize: 9, fontWeight: '900' },

  // Unlock CTA
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 14, borderRadius: 14,
    backgroundColor: COLOR.amber,
    paddingVertical: 15, paddingHorizontal: 16,
    overflow: 'hidden', position: 'relative',
  },
  unlockScanLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  unlockTitle: { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000' },
  unlockSub:   { fontFamily: MONO, fontSize: 8, color: 'rgba(0,0,0,0.65)', marginTop: 2 },
  unlockArrow: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: COLOR.bg,
  },
  footerTxt:  { fontFamily: MONO, fontSize: 8, color: COLOR.mid, flex: 1 },
  footerLink: { fontFamily: MONO, fontSize: 8, fontWeight: '900' },
});

export default RemoteAccessMonetizationCard;
