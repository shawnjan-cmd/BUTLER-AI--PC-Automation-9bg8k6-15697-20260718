/**
 * Butler Non-Blocking Tip & Onboarding Coach v1.0
 * Authored for Butler AI · 100% Original React Native & SVG Geometry
 *
 * Provides lightning-fast, non-blocking tips & tricks across every page:
 *   - Auto-dismisses instantly upon navigation or user tap ("DISMISS" / "GOT IT")
 *   - Page-aware contextual hints (Home, Script Library, Chat, Knowledgebase, Monitor, Settings)
 *   - Zero UI blocking; users can operate at full speed without waiting
 *
 * Fully OnSpace.ai and Expo compatible [1] [2] [3].
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSkin } from '@/hooks/useSkin';

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

interface TipItem {
  route: string;
  title: string;
  body: string;
  actionHint: string;
}

const PAGE_TIPS: Record<string, TipItem> = {
  home: {
    route: 'home',
    title: 'TIP: INSTANT PC PAIRING',
    body: 'Ensure your Python server is running on your PC. Tap "PAIR PC" to bind instantly over LAN with AES-256 verification.',
    actionHint: 'Swipe or tap any tab to move freely at full speed.',
  },
  scripts: {
    route: 'scripts',
    title: 'TIP: 15-MINUTE UNDO WINDOW',
    body: 'Every automated script execution is protected by the Flow Ledger. You have a 15-minute rollback window if needed.',
    actionHint: 'Tap any script card to inspect preflight safety checks.',
  },
  butler: {
    route: 'butler',
    title: 'TIP: LOCAL OLLAMA CHAT',
    body: 'Your prompts stay local. Butler AI interfaces directly with your self-hosted Ollama model with zero external cloud relay.',
    actionHint: 'Type your command below or tap prompt suggestions.',
  },
  knowledge: {
    route: 'knowledge',
    title: 'TIP: PROVENANCE-AWARE RAG',
    body: 'Knowledgebase growth is driven strictly by observed local findings. No invented signals or third-party web scrapers.',
    actionHint: 'Inspect vector index chunks and Bloom filter states.',
  },
  monitor: {
    route: 'monitor',
    title: 'TIP: REAL-TIME TELEMETRY',
    body: 'Hardware metrics stream directly from resource lanes (`resource_hawk.py`) with honest offline state detection.',
    actionHint: 'Pull down to refresh telemetry rates anytime.',
  },
  settings: {
    route: 'settings',
    title: 'TIP: CIPHER CANARY VAULT',
    body: 'Test your local SQLite WAL encryption envelope instantly using the built-in AES-256-GCM cipher canary verifier.',
    actionHint: 'Rotate pairing tokens or reset local state securely.',
  },
};

export const ButlerTipCoach = memo(function ButlerTipCoach({ currentRoute = 'home' }: { currentRoute?: string }) {
  const S = useSkin();
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const tip = PAGE_TIPS[currentRoute] || PAGE_TIPS.home;

  useEffect(() => {
    setDismissed(false);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentRoute, fadeAnim]);

  if (dismissed) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: `${S.panel}EE`, borderColor: `${S.accent}55`, opacity: fadeAnim }]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconBox, { backgroundColor: `${S.accent}20`, borderColor: S.accent }]}>
          <Text style={{ fontSize: 12 }}>💡</Text>
        </View>
        <View style={styles.textBox}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: S.accent, fontFamily: MONO }]}>{tip.title}</Text>
            <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.closeText, { color: S.mid, fontFamily: MONO }]}>[✕]</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.bodyText, { color: S.text, fontFamily: MONO }]}>{tip.body}</Text>
          <Text style={[styles.actionText, { color: S.mid, fontFamily: MONO }]}>{tip.actionHint}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 13,
  },
  actionText: {
    fontSize: 8,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ButlerTipCoach;
