/**
 * RemoteAccessPaywall — Full-screen subscription purchase modal
 * ────────────────────────────────────────────────────────────────
 * Features:
 *  - Animated tier comparison cards with glow fx
 *  - Monthly / Yearly toggle with savings badge
 *  - Security trust signals (no hidden fees, cancel anytime)
 *  - Restore purchases flow
 *  - Real RevenueCat purchase integration via PurchaseContext
 *  - Zero-crash: every path is guarded
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, Pressable,
  Animated, Platform, Dimensions, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePurchase } from '@/contexts/PurchaseContext';
import { TIERS, TierID, Tier } from '@/services/remoteAccessTiers';
import { haptics } from '@/services/haptics';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SW } = Dimensions.get('window');

const C = {
  bg:     '#010508',
  surf:   '#060E1A',
  surf2:  '#09141F',
  cyan:   '#00E5FF',
  green:  '#00FF88',
  amber:  '#FFB020',
  red:    '#FF3344',
  purple: '#CC44FF',
  mid:    '#5A7A96',
  dim:    '#1A2E44',
  text:   '#C8E4F0',
};

function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.15, duration: 700, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

// ── Single tier card ──────────────────────────────────────────────
function TierCard({ tier, isYearly, isCurrentTier, onSelect, busy }: {
  tier: Tier;
  isYearly: boolean;
  isCurrentTier: boolean;
  onSelect: (id: TierID) => void;
  busy: boolean;
}) {
  const glowA = useRef(new Animated.Value(0.3)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!tier.badge) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1, duration: 1600, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.2, duration: 1600, useNativeDriver: false }),
    ]));
    l.start(); return () => l.stop();
  }, [tier.badge]);

  const borderC = tier.badge
    ? glowA.interpolate({ inputRange: [0.2, 1], outputRange: [tier.color + '40', tier.color + 'CC'] })
    : tier.color + '35';

  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
  const isFree = tier.id === 'free';
  const yearlySavings = !isFree ? Math.round((1 - (parseFloat(tier.yearlyPrice.replace('$', '')) / (parseFloat(tier.monthlyPrice.replace('$', '')) * 12))) * 100) : 0;

  return (
    <Animated.View style={[tc.outer, { borderColor: borderC, backgroundColor: isCurrentTier ? tier.color + '10' : C.surf2 }]}>
      {/* Top accent bar */}
      <View style={[tc.topBar, { backgroundColor: tier.color }]} />

      {/* Badge */}
      {tier.badge && (
        <View style={[tc.badge, { backgroundColor: tier.color, borderColor: tier.color + '80' }]}>
          <Text style={tc.badgeTxt}>{tier.badge}</Text>
        </View>
      )}

      {/* Tier header */}
      <View style={tc.header}>
        <View style={[tc.iconBox, { borderColor: tier.color + '55', backgroundColor: tier.color + '12' }]}>
          <MaterialCommunityIcons name={tier.icon as any} size={22} color={tier.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[tc.tierName, { color: tier.color }]}>{tier.name}</Text>
          <Text style={tc.tagline} numberOfLines={1}>{tier.tagline}</Text>
        </View>
        {isCurrentTier && (
          <View style={[tc.currentBadge, { borderColor: tier.color + '60', backgroundColor: tier.color + '14' }]}>
            <PulseDot color={tier.color} size={5} />
            <Text style={[tc.currentBadgeTxt, { color: tier.color }]}>ACTIVE</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={tc.priceRow}>
        <Text style={[tc.price, { color: isFree ? C.mid : '#FFF' }]}>{price}</Text>
        {!isFree && <Text style={tc.pricePer}>/{isYearly ? 'year' : 'month'}</Text>}
        {isYearly && yearlySavings > 0 && !isFree && (
          <View style={[tc.savingsBadge, { backgroundColor: C.green + '20', borderColor: C.green + '50' }]}>
            <Text style={[tc.savingsTxt, { color: C.green }]}>SAVE {yearlySavings}%</Text>
          </View>
        )}
      </View>

      {/* Features */}
      <View style={tc.features}>
        {tier.features.slice(0, 5).map((f, i) => (
          <View key={i} style={tc.featureRow}>
            <MaterialIcons name="check-circle" size={11} color={tier.color} />
            <Text style={tc.featureTxt} numberOfLines={1}>{f}</Text>
          </View>
        ))}
        {tier.features.length > 5 && (
          <Text style={[tc.featureTxt, { color: tier.color + '70', paddingLeft: 15 }]}>
            +{tier.features.length - 5} more features
          </Text>
        )}
      </View>

      {/* CTA */}
      {!isCurrentTier && !isFree && (
        <Pressable
          onPress={() => { haptics.heavy(); onSelect(tier.id); }}
          disabled={busy}
          style={({ pressed }) => [
            tc.cta,
            { backgroundColor: tier.color, opacity: pressed || busy ? 0.75 : 1 },
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <MaterialCommunityIcons name="crown" size={14} color="#000" />
              <Text style={tc.ctaTxt}>GET {tier.name.split(' ')[1]}</Text>
            </>
          )}
        </Pressable>
      )}
      {isCurrentTier && !isFree && (
        <View style={[tc.cta, { backgroundColor: tier.color + '20', borderWidth: 1.5, borderColor: tier.color + '60' }]}>
          <MaterialIcons name="check-circle" size={14} color={tier.color} />
          <Text style={[tc.ctaTxt, { color: tier.color }]}>CURRENT PLAN</Text>
        </View>
      )}
    </Animated.View>
  );
}
const tc = StyleSheet.create({
  outer:       { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', position: 'relative', marginBottom: 12,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 6 } }) },
  topBar:      { height: 3 },
  badge:       { position: 'absolute', top: 12, right: 12, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, zIndex: 10 },
  badgeTxt:    { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 8 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tierName:    { fontFamily: MONO, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  tagline:     { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 },
  currentBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  currentBadgeTxt:{ fontFamily: MONO, fontSize: 7.5, fontWeight: '900' },
  priceRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingHorizontal: 14, paddingBottom: 10 },
  price:       { fontFamily: MONO, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  pricePer:    { fontFamily: MONO, fontSize: 11, color: C.mid, paddingBottom: 5 },
  savingsBadge:{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 4, marginBottom: 4 },
  savingsTxt:  { fontFamily: MONO, fontSize: 8.5, fontWeight: '900' },
  features:    { paddingHorizontal: 14, paddingBottom: 10, gap: 5 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureTxt:  { fontFamily: MONO, fontSize: 9, color: C.text, flex: 1 },
  cta:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, margin: 12, marginTop: 6, borderRadius: 12, paddingVertical: 13 },
  ctaTxt:      { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
});

// ── Trust signals row ─────────────────────────────────────────────
function TrustRow() {
  const SIGNALS = [
    { icon: 'cancel', label: 'Cancel anytime', color: C.green },
    { icon: 'security', label: 'Secure payment', color: C.cyan },
    { icon: 'lock', label: 'No hidden fees', color: C.amber },
    { icon: 'restore', label: 'Restore purchases', color: C.purple },
  ];
  return (
    <View style={ts.row}>
      {SIGNALS.map((s, i) => (
        <View key={i} style={ts.cell}>
          <MaterialIcons name={s.icon as any} size={16} color={s.color} />
          <Text style={[ts.txt, { color: s.color + 'BB' }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
const ts = StyleSheet.create({
  row:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#03070F', borderTopWidth: 1, borderTopColor: C.cyan + '14' },
  cell: { alignItems: 'center', gap: 4, width: '45%' },
  txt:  { fontFamily: MONO, fontSize: 8.5, textAlign: 'center' },
});

// ── Main Paywall Modal ────────────────────────────────────────────
export function RemoteAccessPaywall({
  visible,
  onClose,
  highlightTier,
}: {
  visible: boolean;
  onClose: () => void;
  highlightTier?: TierID;
}) {
  const insets = useSafeAreaInsets();
  const { tier: currentTier, purchase, restore } = usePurchase();
  const [isYearly, setIsYearly] = useState(false);
  const [busy, setBusy]         = useState<TierID | null>(null);
  const [feedback, setFeedback] = useState('');
  const slideA = useRef(new Animated.Value(0)).current;
  const glowA  = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(slideA, { toValue: 1, useNativeDriver: true, tension: 55, friction: 11 }),
      Animated.loop(Animated.sequence([
        Animated.timing(glowA, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowA, { toValue: 0.2, duration: 2000, useNativeDriver: false }),
      ])),
    ]).start();
    return () => slideA.setValue(0);
  }, [visible]);

  const handlePurchase = useCallback(async (tierId: TierID) => {
    if (busy) return;
    setBusy(tierId);
    setFeedback('');
    try {
      const result = await purchase(tierId, isYearly);
      if (result.success) {
        haptics.success();
        setFeedback('Subscription activated!');
        setTimeout(() => { setFeedback(''); onClose(); }, 1400);
      } else {
        haptics.warning?.();
        setFeedback(result.error ?? 'Purchase failed. Please try again.');
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (e: any) {
      setFeedback(e?.message ?? 'Unknown error');
      setTimeout(() => setFeedback(''), 3000);
    }
    setBusy(null);
  }, [busy, isYearly, purchase, onClose]);

  const handleRestore = useCallback(async () => {
    setFeedback('Restoring...');
    const result = await restore();
    if (result.success) {
      setFeedback(result.tier !== 'free' ? `Restored: ${result.tier.toUpperCase()}` : 'No active subscription found');
      setTimeout(() => setFeedback(''), 2000);
    } else {
      setFeedback(result.error ?? 'Restore failed');
      setTimeout(() => setFeedback(''), 2000);
    }
  }, [restore]);

  const slideY = slideA.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  const borderGlow = glowA.interpolate({ inputRange: [0.2, 1], outputRange: [C.cyan + '30', C.cyan + '90'] });

  const TIER_ORDER: TierID[] = ['free', 'pro', 'elite', 'team'];

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={pw.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[pw.sheet, { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideY }] }]}>
          {/* Header stripe */}
          <Animated.View style={{ height: 3, flexDirection: 'row', borderColor: borderGlow }}>
            {[C.cyan, C.green, C.purple, C.amber, C.cyan].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: c }} />
            ))}
          </Animated.View>

          {/* Header row */}
          <View style={pw.header}>
            <View style={pw.headerLeft}>
              <MaterialCommunityIcons name="rocket-launch" size={20} color={C.cyan} />
              <View>
                <Text style={pw.headerTitle}>NEXUS REMOTE ACCESS</Text>
                <Text style={pw.headerSub}>Control your PC from anywhere on Earth</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={pw.closeBtn}>
              <MaterialIcons name="close" size={16} color={C.mid} />
            </Pressable>
          </View>

          {/* Billing toggle */}
          <View style={pw.toggleRow}>
            <TouchableOpacity
              onPress={() => { haptics.light(); setIsYearly(false); }}
              style={[pw.toggleBtn, !isYearly && { backgroundColor: C.cyan + '20', borderColor: C.cyan + '70' }]}
            >
              <Text style={[pw.toggleTxt, { color: !isYearly ? C.cyan : C.mid }]}>MONTHLY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { haptics.light(); setIsYearly(true); }}
              style={[pw.toggleBtn, isYearly && { backgroundColor: C.green + '20', borderColor: C.green + '70' }]}
            >
              <Text style={[pw.toggleTxt, { color: isYearly ? C.green : C.mid }]}>YEARLY</Text>
              <View style={pw.saveBadge}><Text style={pw.saveBadgeTxt}>SAVE 17%</Text></View>
            </TouchableOpacity>
          </View>

          {/* Tier cards */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {TIER_ORDER.map(id => (
              <TierCard
                key={id}
                tier={TIERS[id]}
                isYearly={isYearly}
                isCurrentTier={currentTier === id}
                onSelect={handlePurchase}
                busy={busy === id}
              />
            ))}

            {/* Feedback */}
            {feedback ? (
              <View style={[pw.feedbackBox, { borderColor: (feedback.includes('activated') || feedback.includes('Restored')) ? C.green + '60' : C.red + '60', backgroundColor: (feedback.includes('activated') || feedback.includes('Restored')) ? C.green + '0C' : C.red + '0C' }]}>
                <MaterialIcons name={(feedback.includes('activated') || feedback.includes('Restored')) ? 'check-circle' : 'error'} size={14} color={(feedback.includes('activated') || feedback.includes('Restored')) ? C.green : C.red} />
                <Text style={[pw.feedbackTxt, { color: (feedback.includes('activated') || feedback.includes('Restored')) ? C.green : C.red }]}>{feedback}</Text>
              </View>
            ) : null}

            {/* Restore + legal */}
            <TouchableOpacity onPress={handleRestore} style={pw.restoreBtn}>
              <MaterialIcons name="restore" size={13} color={C.mid} />
              <Text style={pw.restoreTxt}>Restore previous purchases</Text>
            </TouchableOpacity>

            <Text style={pw.legal}>
              Subscriptions auto-renew unless cancelled 24 hours before the end of the period. Manage or cancel anytime in your device's App Store/Play Store settings. By purchasing you agree to our Terms of Service.
            </Text>
          </ScrollView>

          <TrustRow />
        </Animated.View>
      </View>
    </Modal>
  );
}

const pw = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surf, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', maxHeight: '95%',
    ...Platform.select({ ios: { shadowColor: C.cyan, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.2, shadowRadius: 20 }, android: { elevation: 24 } }),
  },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 10 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerTitle: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  headerSub:   { fontFamily: MONO, fontSize: 9, color: C.mid, marginTop: 2 },
  closeBtn:    { width: 34, height: 34, borderRadius: 9, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  toggleRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  toggleBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, borderColor: C.dim, paddingVertical: 10 },
  toggleTxt:   { fontFamily: MONO, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  saveBadge:   { backgroundColor: C.green, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeTxt:{ fontFamily: MONO, fontSize: 7, fontWeight: '900', color: '#000' },
  feedbackBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 10, padding: 10, marginBottom: 10 },
  feedbackTxt: { fontFamily: MONO, fontSize: 10, flex: 1 },
  restoreBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  restoreTxt:  { fontFamily: MONO, fontSize: 10, color: C.mid },
  legal:       { fontFamily: MONO, fontSize: 8, color: C.mid + '60', textAlign: 'center', lineHeight: 13, paddingHorizontal: 8, paddingBottom: 16 },
});

export default RemoteAccessPaywall;
