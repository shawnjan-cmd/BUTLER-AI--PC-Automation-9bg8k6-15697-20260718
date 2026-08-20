/**
 * BUTLER AI — KNOWLEDGE & LEADERBOARD COMMONS v12.0
 * Animated Gamerscore Toast Popups, Custom Rarity Icons, Opt-In Public Chat, & Privacy Boundary Cards.
 * © 2026 Andrej Sladkovic — ALL RIGHTS RESERVED
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Animated, Platform, Dimensions, ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import Svg, { Circle, Line, Rect, Path, Polygon } from 'react-native-svg';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSkin } from '@/hooks/useSkin';
import { SkinHeaderFX } from '@/components/ui/SkinHeaderFX';
import { useFocusEffect } from 'expo-router';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';
import ResearchCrawlerCard from '@/components/ui/ResearchCrawlerCard';
import { serverConnection } from '@/services/serverConnection';
import { knowledgeAccumulator, type CompressedKnowledge } from '@/services/knowledgeAccumulator';
import { haptics } from '@/services/haptics';

const BG    = '#050810';
const SURF  = '#0B0F17';
const SURF2 = '#111621';
const CYAN  = '#38D9E8';
const GREEN = '#2FE38A';
const AMBER = '#FFB43D';
const PURP  = '#A468FF';
const RED   = '#FF4D5E';
const DIM   = '#4A9EFF';
const TEXT  = '#DCE6F2';
const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';

type Fact = { id: string; cat: string; color: string; text: string; when: string; tags: string[] };

function getFactPalette(domain?: string): { cat: string; color: string } {
  const key = String(domain || '').toLowerCase();
  if (key.includes('python')) return { cat: 'Py', color: CYAN };
  if (key.includes('network')) return { cat: 'Net', color: AMBER };
  if (key.includes('security')) return { cat: 'Sec', color: RED };
  if (key.includes('ai')) return { cat: 'AI', color: PURP };
  return { cat: 'Sys', color: GREEN };
}

export default function KnowledgeScreen() {
  const insets = useSafeAreaInsets();
  const skin = useSkin();
  const [activeTab, setActiveTab] = useState<'atlas' | 'crawler' | 'memory' | 'gamerscore' | 'commons'>('atlas');
  const [facts, setFacts] = useState<Fact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [toastData, setToastData] = useState<{ title: string; points: number; rarity: string } | null>(null);

  // Commons chat opt-in state
  const [chatOptIn, setChatOptIn] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; handle: string; score: number; text: string; when: string }>>([
    { id: 'm1', handle: 'CyberGhost_482', score: 850, text: 'Local loopback is running butter-smooth today.', when: '2m ago' },
    { id: 'm2', handle: 'NeonNomad_123', score: 920, text: 'Just unlocked Sentient Coffee Machine achievement!', when: '5m ago' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const toastAnim = useRef(new Animated.Value(-120)).current;
  const toastScale = useRef(new Animated.Value(0.8)).current;

  const showAchievementToast = (title: string, points: number, rarity: string) => {
    setToastData({ title, points, rarity });
    haptics.success();
    Animated.parallel([
      Animated.spring(toastAnim, { toValue: 24, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.spring(toastScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: -140, duration: 300, useNativeDriver: true }).start(() => setToastData(null));
      }, 3000);
    });
  };

  const loadData = useCallback(async () => {
    try {
      const sessions = await knowledgeAccumulator.loadResearch();
      const items = sessions.flatMap(session => session.findings);
      const mapped = items.map((finding, index) => {
        const pal = getFactPalette(finding.domain);
        return {
          id: `fact-${index}-${finding.topic}`,
          cat: pal.cat,
          color: pal.color,
          text: finding.summary || finding.topic,
          when: 'Synced',
          tags: finding.keywords || [],
        };
      });
      setFacts(mapped);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const gamerscoreData = useMemo(() => {
    const achievementsList = [
      { id: '1', title: 'Ctrl+Alt+Delusion', desc: 'Successfully paired your mobile HUD with the host PC server.', points: 50, rarity: 'Common', unlocked: true, icon: 'desktop-tower' },
      { id: '2', title: 'Spiders in the Neural Web', desc: 'Dispatched your first local research crawler.', points: 100, rarity: 'Uncommon', unlocked: true, icon: 'spider' },
      { id: '3', title: "Schrödinger's Backup", desc: 'Encrypted and indexed over 10 vector facts into AES-GCM vault.', points: 150, rarity: 'Rare', unlocked: facts.length >= 5, icon: 'shield-lock' },
      { id: '4', title: 'Zero Cloud, Zero Tears', desc: 'Maintained 100% local-first loopback isolation.', points: 200, rarity: 'Epic', unlocked: true, icon: 'shield-check' },
      { id: '5', title: 'Bot Smasher 3000', desc: 'Blocked an automated auto-clicker spamming the leaderboard.', points: 250, rarity: 'Legendary', unlocked: false, icon: 'robot-confused' },
      { id: '6', title: 'Sentient Coffee Machine', desc: 'Reached Vault Archon status with 1000G total score.', points: 250, rarity: 'Legendary', unlocked: false, icon: 'coffee' },
    ];
    const totalScore = achievementsList.reduce((acc, curr) => acc + (curr.unlocked ? curr.points : 0), 0);
    return { achievements: achievementsList, totalScore };
  }, [facts.length]);

  const addKnowledge = async () => {
    if (!newTopic.trim()) return;
    haptics.medium();
    const item: CompressedKnowledge = {
      domain: 'User',
      topic: newTopic.trim(),
      summary: newTopic.trim(),
      keywords: ['user', 'manual'],
      examples: [newTopic.trim()],
      metadata: { source: 'local://manual', timestamp: new Date().toISOString(), confidence: 1.0 },
    };
    knowledgeAccumulator.addFinding(item);
    await knowledgeAccumulator.saveNow();
    setNewTopic('');
    loadData();
    showAchievementToast("Schrödinger's Backup", 150, 'Rare');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    if (!chatOptIn) {
      Alert.alert('Opt-In Required', 'Please toggle "Join Leaderboard Commons" to participate in public chat.');
      return;
    }
    haptics.medium();
    const handle = `CipherAgent_${Math.floor(100 + Math.random() * 900)}`;
    const newMsg = {
      id: `msg-${Date.now()}`,
      handle,
      score: gamerscoreData.totalScore,
      text: chatInput.trim(),
      when: 'Just now',
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    try {
      if (serverConnection.isConnected()) {
        await (serverConnection as any).request('/api/leaderboard/chat', 'POST', { handle, score: gamerscoreData.totalScore, text: newMsg.text });
      }
    } catch {}
  };

  return (
    <TabErrorBoundary name="Knowledge">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <SkinHeaderFX accent={skin.accent} accent2={skin.accent2} accent3={skin.accent3} stripe={skin.stripe} fxKey="knowledge" still={!skin.headerGlow} />

        {/* Animated Rarity Achievement Toast */}
        {toastData && (
          <Animated.View style={[
            styles.toastBox,
            {
              transform: [{ translateY: toastAnim }, { scale: toastScale }],
              borderColor: toastData.rarity === 'Legendary' ? AMBER : toastData.rarity === 'Epic' ? PURP : CYAN,
            }
          ]}>
            <View style={[styles.toastIconBox, { backgroundColor: (toastData.rarity === 'Legendary' ? AMBER : CYAN) + '22' }]}>
              <MaterialCommunityIcons
                name={toastData.rarity === 'Legendary' ? 'crown' : 'trophy'}
                size={22}
                color={toastData.rarity === 'Legendary' ? AMBER : CYAN}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toastRarity, { color: toastData.rarity === 'Legendary' ? AMBER : CYAN }]}>
                {toastData.rarity.toUpperCase()} ACHIEVEMENT UNLOCKED
              </Text>
              <Text style={styles.toastTitle}>{toastData.title}</Text>
              <Text style={styles.toastPoints}>+{toastData.points}G Gamerscore</Text>
            </View>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="brain" size={26} color={CYAN} />
            <Text style={styles.headerTitle}>KNOWLEDGE VAULT</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{gamerscoreData.totalScore}G / 1000G</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Decentralized Neural Memory & Gamerscore Badges</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsRow}>
          {[
            { id: 'atlas', label: 'ATLAS', icon: 'vector-polyline' },
            { id: 'crawler', label: 'CRAWLER', icon: 'spider' },
            { id: 'memory', label: 'MEMORY', icon: 'database-outline' },
            { id: 'gamerscore', label: 'BADGES', icon: 'trophy-outline' },
            { id: 'commons', label: 'COMMONS', icon: 'forum-outline' },
          ].map(t => {
            const active = activeTab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => { haptics.selection(); setActiveTab(t.id as any); }}
              >
                <MaterialCommunityIcons name={t.icon as any} size={14} color={active ? CYAN : DIM} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {activeTab === 'atlas' && (
          <ScrollView contentContainerStyle={styles.contentScroll}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>NEURAL VECTOR ATLAS</Text>
              <Text style={styles.cardDesc}>Real-time clustering of local system automation nodes and memory vectors.</Text>
              
              <View style={styles.svgContainer}>
                <Svg height="160" width="100%">
                  <Line x1="40" y1="30" x2="160" y2="80" stroke={CYAN} strokeWidth="1" strokeOpacity="0.4" />
                  <Line x1="160" y1="80" x2="280" y2="40" stroke={GREEN} strokeWidth="1" strokeOpacity="0.4" />
                  <Circle cx="40" cy="30" r="6" fill={CYAN} />
                  <Circle cx="160" cy="80" r="8" fill={GREEN} />
                  <Circle cx="280" cy="40" r="5" fill={AMBER} />
                </Svg>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{facts.length}</Text>
                  <Text style={styles.metricKey}>INDEXED NODES</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>{gamerscoreData.totalScore}G</Text>
                  <Text style={styles.metricKey}>GAMERSCORE</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricVal}>99.8%</Text>
                  <Text style={styles.metricKey}>BLOOM ACCURACY</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'crawler' && (
          <ScrollView contentContainerStyle={styles.contentScroll}>
            <ResearchCrawlerCard />
          </ScrollView>
        )}

        {activeTab === 'memory' && (
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.inputBox}
              placeholder="Inject raw fact or knowledge string..."
              placeholderTextColor="#4A9EFF"
              value={newTopic}
              onChangeText={setNewTopic}
            />
            <TouchableOpacity style={styles.actionBtn} onPress={addKnowledge}>
              <MaterialIcons name="add" size={18} color={BG} />
              <Text style={styles.actionBtnText}>INJECT KNOWLEDGE VECTOR</Text>
            </TouchableOpacity>

            <FlatList
              data={facts}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.factCard}>
                  <View style={styles.factHeader}>
                    <View style={[styles.catBadge, { backgroundColor: item.color + '22', borderColor: item.color }]}>
                      <Text style={[styles.catText, { color: item.color }]}>{item.cat}</Text>
                    </View>
                    <Text style={styles.factWhen}>{item.when}</Text>
                  </View>
                  <Text style={styles.factText}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="database-off" size={40} color={CYAN} />
                  <Text style={styles.emptyText}>No knowledge records found.</Text>
                </View>
              }
            />
          </View>
        )}

        {activeTab === 'gamerscore' && (
          <ScrollView contentContainerStyle={styles.contentScroll}>
            <View style={styles.card}>
              <View style={styles.gsHeader}>
                <Text style={styles.cardTitle}>ACHIEVEMENT CATALOG (1000G)</Text>
                <Text style={styles.gsTotal}>{gamerscoreData.totalScore}G</Text>
              </View>
              <Text style={styles.cardDesc}>Complete local automation challenges to unlock badges and gamerscore.</Text>
              
              {gamerscoreData.achievements.map(ach => (
                <View key={ach.id} style={[styles.achRow, ach.unlocked && styles.achUnlocked]}>
                  <View style={[styles.achIconBox, ach.unlocked && { backgroundColor: AMBER + '22', borderColor: AMBER }]}>
                    <MaterialCommunityIcons name={ach.icon as any} size={20} color={ach.unlocked ? AMBER : DIM} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.achTitle, ach.unlocked && { color: TEXT }]}>{ach.title}</Text>
                      <Text style={[styles.achPoints, ach.unlocked && { color: AMBER }]}>+{ach.points}G</Text>
                    </View>
                    <Text style={styles.achDesc}>{ach.desc}</Text>
                  </View>
                  <MaterialIcons name={ach.unlocked ? "check-circle" : "lock"} size={18} color={ach.unlocked ? GREEN : DIM} />
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {activeTab === 'commons' && (
          <ScrollView contentContainerStyle={styles.contentScroll}>
            {/* Privacy & Security Boundary Card */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MaterialCommunityIcons name="shield-check" size={20} color={GREEN} />
                <Text style={styles.cardTitle}>LEADERBOARD COMMONS PRIVACY</Text>
              </View>
              <Text style={styles.cardDesc}>
                Butler AI is local-first. Your private neural memory, PC automation commands, and local vault never leave your device or companion server. Joining Leaderboard Commons is optional and transmits only your server-assigned pseudonymous handle and gamerscore.
              </Text>
              
              <View style={styles.optInRow}>
                <Text style={styles.optInLabel}>Join Leaderboard Commons Chat</Text>
                <Switch
                  value={chatOptIn}
                  onValueChange={val => { haptics.selection(); setChatOptIn(val); }}
                  trackColor={{ false: SURF2, true: CYAN }}
                  thumbColor={chatOptIn ? BG : DIM}
                />
              </View>
            </View>

            {/* Public Chat Room */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>COMMUNITY CHAT ROOM</Text>
              <Text style={styles.cardDesc}>Chat anonymously with fellow automation runners. Your gamerscore badge is displayed next to your handle.</Text>
              
              {chatMessages.map(msg => (
                <View key={msg.id} style={styles.chatBubble}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatHandle}>{msg.handle}</Text>
                    <View style={styles.chatBadge}>
                      <Text style={styles.chatBadgeText}>{msg.score}G</Text>
                    </View>
                    <Text style={styles.chatWhen}>{msg.when}</Text>
                  </View>
                  <Text style={styles.chatText}>{msg.text}</Text>
                </View>
              ))}

              {chatOptIn ? (
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Broadcast anonymous message..."
                    placeholderTextColor="#4A9EFF"
                    value={chatInput}
                    onChangeText={setChatInput}
                  />
                  <TouchableOpacity style={styles.chatSendBtn} onPress={sendChatMessage}>
                    <MaterialIcons name="send" size={18} color={BG} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.lockedChatBox}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={DIM} />
                  <Text style={styles.lockedChatText}>Enable opt-in switch above to participate in chat.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

      </View>
    </TabErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  toastBox: {
    position: 'absolute', top: 30, left: 16, right: 16, zIndex: 9999,
    backgroundColor: '#0B0F17', borderWidth: 2, borderRadius: 12,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: CYAN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
  },
  toastIconBox: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: CYAN },
  toastRarity: { fontFamily: MONO, fontSize: 9, letterSpacing: 1 },
  toastTitle: { fontFamily: MONO, fontSize: 13, color: TEXT, fontWeight: 'bold', marginTop: 2 },
  toastPoints: { fontFamily: MONO, fontSize: 10, color: AMBER, marginTop: 2 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.12)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: MONO, fontSize: 16, color: CYAN, letterSpacing: 1, flex: 1 },
  badge: { backgroundColor: AMBER + '18', borderWidth: 1, borderColor: AMBER, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontFamily: MONO, fontSize: 9, color: AMBER, fontWeight: 'bold' },
  headerSub: { fontFamily: MONO, fontSize: 11, color: DIM, marginTop: 4 },
  tabsRow: { flexDirection: 'row', padding: 8, gap: 4, backgroundColor: SURF },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, backgroundColor: SURF2, gap: 3 },
  tabBtnActive: { backgroundColor: CYAN + '22', borderWidth: 1, borderColor: CYAN },
  tabLabel: { fontFamily: MONO, fontSize: 9, color: DIM },
  tabLabelActive: { color: CYAN },
  contentScroll: { padding: 16 },
  card: { backgroundColor: SURF, borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontFamily: MONO, fontSize: 13, color: CYAN, marginBottom: 6 },
  cardDesc: { fontFamily: MONO, fontSize: 11, color: DIM, marginBottom: 14, lineHeight: 16 },
  svgContainer: { alignItems: 'center', marginVertical: 10, backgroundColor: SURF2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)' },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricBox: { flex: 1, backgroundColor: SURF2, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)' },
  metricVal: { fontFamily: MONO, fontSize: 14, color: CYAN },
  metricKey: { fontFamily: MONO, fontSize: 8, color: DIM, marginTop: 2 },
  inputBox: { marginHorizontal: 16, marginTop: 12, backgroundColor: SURF, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', borderRadius: 8, paddingHorizontal: 12, height: 44, color: TEXT, fontFamily: MONO, fontSize: 12 },
  factCard: { backgroundColor: SURF, borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)', borderRadius: 10, padding: 14, marginBottom: 12 },
  factHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catText: { fontFamily: MONO, fontSize: 10 },
  factWhen: { fontFamily: MONO, fontSize: 10, color: DIM },
  factText: { fontFamily: MONO, fontSize: 12, color: TEXT, lineHeight: 18, marginBottom: 4 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: MONO, fontSize: 14, color: TEXT, marginTop: 12 },
  actionBtn: { flexDirection: 'row', backgroundColor: CYAN, marginHorizontal: 16, marginBottom: 12, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnText: { fontFamily: MONO, fontSize: 12, color: BG, fontWeight: 'bold' },
  gsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  gsTotal: { fontFamily: MONO, fontSize: 14, color: AMBER, fontWeight: 'bold' },
  achRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURF2, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)', gap: 12 },
  achUnlocked: { borderColor: AMBER + '44', backgroundColor: AMBER + '08' },
  achIconBox: { width: 36, height: 36, borderRadius: 6, backgroundColor: SURF, borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  achTitle: { fontFamily: MONO, fontSize: 12, color: TEXT },
  achPoints: { fontFamily: MONO, fontSize: 11, color: DIM },
  achDesc: { fontFamily: MONO, fontSize: 10, color: DIM, marginTop: 2 },
  optInRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: SURF2, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)' },
  optInLabel: { fontFamily: MONO, fontSize: 11, color: TEXT },
  chatBubble: { backgroundColor: SURF2, padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  chatHandle: { fontFamily: MONO, fontSize: 11, color: CYAN, flex: 1 },
  chatBadge: { backgroundColor: AMBER + '22', borderWidth: 1, borderColor: AMBER, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  chatBadgeText: { fontFamily: MONO, fontSize: 8, color: AMBER },
  chatWhen: { fontFamily: MONO, fontSize: 9, color: DIM },
  chatText: { fontFamily: MONO, fontSize: 11, color: TEXT, lineHeight: 16 },
  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chatInput: { flex: 1, backgroundColor: SURF2, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)', borderRadius: 8, paddingHorizontal: 12, height: 40, color: TEXT, fontFamily: MONO, fontSize: 11 },
  chatSendBtn: { backgroundColor: CYAN, width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  lockedChatBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: SURF2, padding: 16, borderRadius: 8, gap: 8, marginTop: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.1)' },
  lockedChatText: { fontFamily: MONO, fontSize: 10, color: DIM, textAlign: 'center' },
});
