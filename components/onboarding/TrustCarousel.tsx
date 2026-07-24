/**
 * TrustCarousel — rotating 3×2 security credential cards.
 * Auto-advances every 4s with cross-fade. Used in onboarding Screen 1.
 *
 * Section 19.2-B of Butler AI Master Instructions v9.0
 * © 2024-2026 Andrej Sladkovic. All Rights Reserved.
 */
import React, { memo, useState, useEffect, useRef } from 'react';
import {
  View, Text, Animated, ScrollView, StyleSheet,
  Dimensions, AppState,
} from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import Reanimated from 'react-native-reanimated';
import { TRUST_CARDS } from '@/constants/trustCards';
import { FontFamily } from '@/constants/typography';
import { NexusIcon } from '@/components/ui/NexusIcons';
import NexusBadge from '@/components/ui/NexusBadge';

const PAGE_SIZE      = 6;
const AUTO_ADVANCE   = 4000;
const MOTION_SPRING  = { damping: 22, stiffness: 260 };

// Color tokens (inline to avoid circular imports in onboarding)
const C = {
  bg:       '#0A0F1A',
  card:     '#131924',
  primary:  '#6EE7FF',
  success:  '#34D399',
  textDim:  '#3D4C63',
  textMuted:'#5B6E85',
};

// ── Single trust card ──────────────────────────────────────────────────────
const TrustCard = memo(function TrustCard({
  card, width, index,
}: {
  card: typeof TRUST_CARDS[0];
  width: number;
  index: number;
}) {
  const scale   = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withDelay(index * 45, withSpring(1, MOTION_SPRING));
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 200 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={[
      animStyle,
      {
        width,
        height:          Math.round(width * 1.15),
        backgroundColor: C.card,
        borderRadius:    8,
        borderWidth:     1,
        borderColor:     card.color + '30',
        borderTopWidth:  1.5,
        borderTopColor:  card.color + '80',
        padding:         8,
        overflow:        'hidden',
      },
    ]}>
      {/* Corner bracket TL */}
      <View style={{
        position: 'absolute', top: 4, left: 4,
        width: 7, height: 7,
        borderTopWidth: 1, borderLeftWidth: 1,
        borderColor: card.color + '60',
      }} />
      {/* Glow dot TR */}
      <View style={{
        position: 'absolute', top: 6, right: 6,
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: card.color,
        shadowColor: card.color, shadowRadius: 4,
        shadowOpacity: 0.8, shadowOffset: { width: 0, height: 0 },
      }} />
      <NexusIcon name={card.icon as any} size={18} color={card.color} />
      <Text style={{
        fontFamily:      FontFamily.displayBold,
        fontSize:        16,
        color:           card.color,
        letterSpacing:   0.5,
        marginTop:       4,
        textShadowColor: card.color + '60',
        textShadowRadius: 8,
        textShadowOffset: { width: 0, height: 0 },
      }}>
        {card.value}
      </Text>
      <Text style={{
        fontFamily:    FontFamily.mono,
        fontSize:      7,
        color:         C.textDim,
        letterSpacing: 1,
        marginTop:     2,
        textTransform: 'uppercase',
      }}>
        {card.label}
      </Text>
    </Reanimated.View>
  );
});

// ── Security layer pills ───────────────────────────────────────────────────
const SECURITY_LAYERS = [
  { label: 'FIREWALL',  sublabel: 'ACTIVE',     color: '#00FF88' },
  { label: 'INTRUSION', sublabel: 'ACTIVE',     color: '#00E5FF' },
  { label: 'ENCRYPT',   sublabel: 'AES-256',    color: '#A366F5' },
  { label: 'ACCESS',    sublabel: 'ZERO-TRUST', color: '#FF7700' },
  { label: 'HMAC',      sublabel: 'SHA-256',    color: '#00FF88' },
  { label: 'MEMORY',    sublabel: 'ENCRYPTED',  color: '#00E5FF' },
] as const;

export const SecurityLayerRow = memo(function SecurityLayerRow() {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{
        fontFamily:    FontFamily.mono,
        fontSize:      8,
        color:         C.textDim,
        letterSpacing: 2,
        marginBottom:  7,
      }}>
        ◈ SECURITY PROTOCOLS — 6 ACTIVE LAYERS
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {SECURITY_LAYERS.map(({ label, sublabel, color }) => (
          <View key={label} style={{
            borderRadius:    6,
            borderWidth:     1,
            borderColor:     color + '40',
            backgroundColor: color + '0A',
            paddingHorizontal: 8,
            paddingVertical:   5,
            alignItems:      'center',
            gap:              2,
          }}>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 7, color, letterSpacing: 1 }}>
              {label}
            </Text>
            <Text style={{ fontFamily: FontFamily.mono, fontSize: 6, color: color + '80', letterSpacing: 0.5 }}>
              {sublabel}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

// ── TrustCarousel ──────────────────────────────────────────────────────────
interface TrustCarouselProps {
  /** Cards per page. Default 6 (3×2). Use 3 for mini homepage version. */
  pageSize?:       number;
  /** Auto-advance interval ms. Default 4000. */
  autoAdvanceMs?:  number;
}

export const TrustCarousel = memo(function TrustCarousel({
  pageSize      = PAGE_SIZE,
  autoAdvanceMs = AUTO_ADVANCE,
}: TrustCarouselProps) {
  const [page, setPage]     = useState(0);
  const totalPages          = Math.ceil(TRUST_CARDS.length / pageSize);
  const pageRef             = useRef(0);
  const fadeAnim            = useRef(new Animated.Value(1)).current;
  const mountedRef          = useRef(true);

  const SW     = Dimensions.get('window').width;
  const cardW  = Math.max(60, Math.floor((SW - 28 - 8 * 2) / 3));

  useEffect(() => {
    mountedRef.current = true;
    const t = setInterval(() => {
      if (!mountedRef.current) return;
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        if (!mountedRef.current) return;
        pageRef.current = (pageRef.current + 1) % totalPages;
        setPage(pageRef.current);
      }, 280);
    }, autoAdvanceMs);

    // Pause in background
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active') clearInterval(t);
    });

    return () => {
      mountedRef.current = false;
      clearInterval(t);
      sub.remove();
    };
  }, []);

  const cards = TRUST_CARDS.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <View style={{ marginHorizontal: 14 }}>
      {/* Header */}
      <View style={{
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   10,
      }}>
        <Text style={{
          fontFamily:    FontFamily.mono,
          fontSize:      9,
          color:         C.textDim,
          letterSpacing: 2,
        }}>
          ◈ SECURITY CREDENTIALS
        </Text>
        <NexusBadge variant="online" label="STATUS: SECURE" color={C.success} size="sm" />
      </View>

      {/* 3×2 grid */}
      <Animated.View style={{
        opacity:        fadeAnim,
        flexDirection:  'row',
        flexWrap:       'wrap',
        gap:             8,
      }}>
        {cards.map((card, i) => (
          <TrustCard
            key={`${page}-${i}`}
            card={card}
            width={cardW}
            index={i}
          />
        ))}
      </Animated.View>

      {/* Page dots */}
      <View style={{
        marginTop:      8,
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'center',
        gap:             6,
      }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <View key={i} style={{
            width:           i === page ? 16 : 4,
            height:          4,
            borderRadius:    2,
            backgroundColor: i === page ? C.primary : C.textDim,
          }} />
        ))}
      </View>

      <Text style={{
        textAlign:     'center',
        fontFamily:    FontFamily.mono,
        fontSize:      8,
        color:         C.textDim,
        letterSpacing: 1,
        marginTop:     6,
      }}>
        · rotates every {autoAdvanceMs / 1000}s · {TRUST_CARDS.length} verifiable guarantees ·
      </Text>

      {pageSize >= 6 && <SecurityLayerRow />}
    </View>
  );
});

export default TrustCarousel;
