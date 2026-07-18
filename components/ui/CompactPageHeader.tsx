/**
 * CompactPageHeader v4.0 — Unified NEXUS HUD header used by every tab.
 *
 * DESIGN RULES (enforced here so all pages are identical height):
 *  • Total header height = safeTop + 48px row + 2px accent bar + extraRow (optional)
 *  • Accent bar is always the first visual element — 5-colour stripe
 *  • Row is fixed minHeight:48 — nothing can expand it
 *  • Action buttons are 30×30 — no overflow
 *  • extraRow has its own 1px separator; pages that pass one get a clean strip below the row
 *  • All animations use useNativeDriver:true except colour interpolations which are JS-driver
 *    but capped to a single loop — no expensive shimmer sweeps that eat frames
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Platform, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const SW   = Math.max(1, Dimensions.get('window').width || 375);
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

// Five-colour accent palette shared across all headers
const STRIPE = ['#00E5FF','#00FF88','#CC44FF','#FFB020','#FF6EB4'] as const;

export interface CompactPageHeaderProps {
  accent:      string;
  icon:        string;
  iconLib?:    'material' | 'community';
  title:       string;
  badge?:      string;
  badgeColor?: string;
  isConnected?: boolean;
  safeTop?:    number;
  leftAction?:   { icon: string; onPress: () => void; color?: string; iconLib?: 'material' | 'community' };
  rightAction?:  { icon: string; onPress: () => void; color?: string; iconLib?: 'material' | 'community' };
  rightAction2?: { icon: string; onPress: () => void; color?: string; iconLib?: 'material' | 'community' };
  rightAction3?: { icon: string; onPress: () => void; color?: string; iconLib?: 'material' | 'community' };
  extraRow?: React.ReactNode;
}

// ── tiny HUD corner brackets ─────────────────────────────────────
function Corners({ color }: { color: string }) {
  const s = { position: 'absolute' as const, width: 8, height: 8 };
  const b = { borderColor: color };
  return (
    <>
      <View style={[s, { top:0, left:0,  borderTopWidth:1.5, borderLeftWidth:1.5,  ...b }]} />
      <View style={[s, { top:0, right:0, borderTopWidth:1.5, borderRightWidth:1.5, ...b }]} />
      <View style={[s, { bottom:0, left:0,  borderBottomWidth:1.5, borderLeftWidth:1.5,  ...b }]} />
      <View style={[s, { bottom:0, right:0, borderBottomWidth:1.5, borderRightWidth:1.5, ...b }]} />
    </>
  );
}

export function CompactPageHeader({
  accent, icon, iconLib = 'material', title, badge, badgeColor,
  isConnected = false, safeTop = 0,
  leftAction, rightAction, rightAction2, rightAction3,
  extraRow,
}: CompactPageHeaderProps) {

  const bCol    = badgeColor ?? accent;
  const connCol = isConnected ? '#00FF88' : '#FF4455';

  // JS-driver: glow for icon border + conn dot  (single value, one loop)
  const glowA = useRef(new Animated.Value(0.35)).current;
  // Native-driver: conn dot scale bounce
  const dotS  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1,    duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.25, duration: 1400, useNativeDriver: false }),
    ]));
    const dot = Animated.loop(Animated.sequence([
      Animated.timing(dotS,  { toValue: 1.35, duration: 700, useNativeDriver: true  }),
      Animated.timing(dotS,  { toValue: 1,    duration: 700, useNativeDriver: true  }),
    ]));
    glow.start(); dot.start();
    return () => { glow.stop(); dot.stop(); };
  }, []);

  const iconBorder = glowA.interpolate({ inputRange:[0.25,1], outputRange:[accent+'40', accent+'BB'] });

  const Icon = iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;

  const mkBtn = (
    a: { icon: string; onPress: () => void; color?: string; iconLib?: 'material' | 'community' },
    key: string
  ) => {
    const BIcon = a.iconLib === 'community' ? MaterialCommunityIcons : MaterialIcons;
    const col   = a.color ?? accent;
    return (
      <TouchableOpacity
        key={key}
        onPress={a.onPress}
        style={[st.btn, { borderColor: col+'50', backgroundColor: col+'0D' }]}
        hitSlop={{ top:10, bottom:10, left:10, right:10 }}
        activeOpacity={0.8}
      >
        <Corners color={col+'45'} />
        <BIcon name={a.icon as any} size={14} color={col} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[st.root, { paddingTop: safeTop }]}>

      {/* ── 5-colour stripe (always 3px tall, no animation) ── */}
      <View style={st.stripe}>
        {STRIPE.map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>

      {/* ── main 48px row ── */}
      <View style={st.row}>

        {/* LEFT */}
        <View style={st.side}>
          {leftAction ? mkBtn(leftAction, 'l') : (
            <Animated.View style={[st.iconOrb, {
              borderColor: iconBorder,
              backgroundColor: accent + '0F',
              ...Platform.select({ ios:{ shadowColor:accent, shadowOffset:{width:0,height:0}, shadowOpacity:0.7, shadowRadius:8 }, android:{} }),
            }]}>
              <Icon name={icon as any} size={14} color={accent} />
            </Animated.View>
          )}
        </View>

        {/* CENTRE — title + badge */}
        <View style={st.centre}>
          {/* If leftAction provided, show icon here instead */}
          {leftAction ? (
            <Animated.View style={[st.iconOrbSm, {
              borderColor: iconBorder,
              backgroundColor: accent + '0F',
            }]}>
              <Icon name={icon as any} size={12} color={accent} />
            </Animated.View>
          ) : null}
          <Text style={[st.title, { color:'#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {title}
          </Text>
          {badge ? (
            <View style={[st.badge, { borderColor: bCol+'60', backgroundColor: bCol+'14' }]}>
              <Text style={[st.badgeTxt, { color: bCol }]}>{badge}</Text>
            </View>
          ) : null}
        </View>

        {/* RIGHT */}
        <View style={[st.side, { justifyContent:'flex-end', gap:5 }]}>
          {rightAction3 ? mkBtn(rightAction3,'r3') : null}
          {rightAction2 ? mkBtn(rightAction2,'r2') : null}
          {rightAction  ? mkBtn(rightAction, 'r1') : null}
          {/* Conn dot */}
          <Animated.View style={[st.connDot, {
            backgroundColor: connCol,
            transform: [{ scale: dotS }],
            ...Platform.select({ ios:{ shadowColor:connCol, shadowOffset:{width:0,height:0}, shadowOpacity:0.9, shadowRadius:5 }, android:{} }),
          }]} />
        </View>
      </View>

      {/* ── optional extra row ── */}
      {extraRow ? (
        <View style={[st.extra, { borderTopColor: accent+'22' }]}>
          {extraRow}
        </View>
      ) : null}

      {/* ── bottom data-bar (thin, static) ── */}
      <View style={[st.dataBar, { backgroundColor: accent+'45' }]}>
        {/* segmented overlay */}
        <View style={st.segs} pointerEvents="none">
          {[0.3,0.55,0.4,0.7,0.5,0.35,0.65,0.45,0.6,0.38,0.72,0.5].map((w,i) => (
            <View key={i} style={{ flex:w, height:'100%', backgroundColor:'rgba(255,255,255,0.18)', marginHorizontal:0.5, borderRadius:1 }} />
          ))}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    backgroundColor: '#03080F',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(0,220,255,0.18)',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor:'#00DCFF', shadowOffset:{width:0,height:3}, shadowOpacity:0.18, shadowRadius:8 },
      android: { elevation:5 },
    }),
  },
  // ── 5-colour accent stripe ──
  stripe: {
    height: 3,
    flexDirection: 'row',
  },
  // ── fixed-height main row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    minHeight: 48,
    maxHeight: 48,
  },
  side: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  centre: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    overflow: 'hidden',
    minWidth: 0,
  },
  // ── icon orb (used when no leftAction) ──
  iconOrb: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  // ── smaller orb when leftAction is present ──
  iconOrbSm: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.8,
    flexShrink: 1,
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  badgeTxt: {
    fontFamily: MONO,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // ── action button ──
  btn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  // ── connection status dot ──
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
    marginLeft: 2,
  },
  // ── extra row ──
  extra: {
    borderTopWidth: 1,
  },
  // ── bottom 2px data bar ──
  dataBar: {
    height: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  segs: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
