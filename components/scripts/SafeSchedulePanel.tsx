/**
 * BUTLER AI — SAFE SCHEDULE PANEL v1.0
 * ─────────────────────────────────────────────────────────────────────────
 * Displays the 5 hardcoded, non-editable, pre-approved safe tasks.
 *
 * DESIGN PRINCIPLES:
 *  • Zero visual ambiguity — user always knows EXACTLY what will happen
 *  • Persistent pending banner — cannot be missed
 *  • One-tap cancel — always visible and always works
 *  • Full transparency panels — every task explains itself in plain English
 *  • Play Store reviewer note — visible inside the panel
 *
 * SECURITY NOTES:
 *  • All task code is hardcoded in services/safeSchedule.ts — READ ONLY
 *  • Every execution passes 6 independent guards before reaching server
 *  • Integrity hash verified before EVERY execution
 *  • Safety scanner re-runs before EVERY execution
 *
 * © 2026 Andrej Sladkovic — PROPRIETARY. All rights reserved.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Platform, Dimensions, ScrollView, Modal,
  ActivityIndicator, Alert, AppState,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { haptics } from '@/services/haptics';
import { safeScheduleEngine, SAFE_TASKS, SafeTask, PendingTask, AuditEntry } from '@/services/safeSchedule';
import { serverConnection } from '@/services/serverConnection';

const MONO: any = Platform.OS === 'ios' ? 'Menlo-Bold' : 'monospace';
const { width: SW } = Dimensions.get('window');
const PAD = 14;

// ─── PALETTE (matches scripts.tsx tokens) ─────────────────────────
const C = {
  bg:     '#010407',
  surf:   '#060D18',
  surf2:  '#0A1422',
  cyan:   '#00E5FF',
  green:  '#00FF88',
  amber:  '#FFB020',
  red:    '#FF3344',
  purple: '#CC44FF',
  teal:   '#00CCBB',
  blue:   '#4488FF',
  text:   '#C8E4F0',
  mid:    '#4A7090',
  dim:    '#1A2E44',
  border: 'rgba(0,229,255,0.10)',
};

function glow(hex: string, pct = 8): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${(pct / 100).toFixed(2)})`;
}

// ─── MICRO ATOMS ──────────────────────────────────────────────────
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  const a = useRef(new Animated.Value(0.4)).current;
  const m = useRef(true);
  useEffect(() => {
    m.current = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { m.current = false; loop.stop(); };
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
}

function HudCorners({ color, size = 8, t = 1.5 }: { color: string; size?: number; t?: number }) {
  const b: any = { position: 'absolute', width: size, height: size };
  return (
    <>
      <View style={[b, { top: 0, left: 0,     borderTopWidth: t,    borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { top: 0, right: 0,    borderTopWidth: t,    borderRightWidth: t,  borderColor: color }]} />
      <View style={[b, { bottom: 0, left: 0,  borderBottomWidth: t, borderLeftWidth: t,   borderColor: color }]} />
      <View style={[b, { bottom: 0, right: 0, borderBottomWidth: t, borderRightWidth: t,  borderColor: color }]} />
    </>
  );
}

// ─── IMPACT BADGE ─────────────────────────────────────────────────
function ImpactBadge({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <View style={[ib.root, { borderColor: color + '45', backgroundColor: glow(color, 8) }]}>
      <MaterialCommunityIcons name={icon as any} size={10} color={color} />
      <Text style={[ib.txt, { color }]}>{label}</Text>
    </View>
  );
}
const ib = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  txt:  { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
});

// ─── PENDING TASK BANNER ─────────────────────────────────────────
// ALWAYS VISIBLE when a task is pending — persistent, cannot be dismissed
function PendingBanner({
  pending, task, onCancel, onExecute, isConn, executing,
}: {
  pending: PendingTask;
  task: SafeTask;
  onCancel: () => void;
  onExecute: () => void;
  isConn: boolean;
  executing: boolean;
}) {
  const pulseA = useRef(new Animated.Value(0.6)).current;
  const glowA  = useRef(new Animated.Value(0.4)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulseA, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseA, { toValue: 0.3, duration: 900, useNativeDriver: true }),
    ]));
    const gLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowA, { toValue: 1.0, duration: 1400, useNativeDriver: false }),
      Animated.timing(glowA, { toValue: 0.3, duration: 1400, useNativeDriver: false }),
    ]));
    pLoop.start(); gLoop.start();
    return () => { pLoop.stop(); gLoop.stop(); };
  }, []);

  const borderC = glowA.interpolate({
    inputRange: [0.3, 1.0],
    outputRange: [task.color + '50', task.color + 'CC'],
  });

  const timeLeft = Math.max(0, Math.round((pending.expiresAt - Date.now()) / 60_000));

  return (
    <Animated.View style={[pb.root, { borderColor: borderC }]}>
      <View style={{ height: 3.5, backgroundColor: task.color }} />
      <HudCorners color={task.color + '50'} size={8} />

      {/* Header */}
      <View style={pb.hdr}>
        <View style={[pb.iconOrb, { borderColor: task.color + '60', backgroundColor: glow(task.color, 14) }]}>
          <Animated.View style={{ opacity: pulseA }}>
            <MaterialCommunityIcons name={task.icon as any} size={20} color={task.color} />
          </Animated.View>
          <View style={[pb.orbDot, { backgroundColor: C.amber }]} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <PulseDot color={C.amber} size={5} />
            <Text style={[pb.pendingLabel, { color: C.amber }]}>TASK PENDING EXECUTION</Text>
          </View>
          <Text style={[pb.taskTitle, { color: task.color }]} numberOfLines={1}>{task.title}</Text>
          <Text style={pb.taskSub} numberOfLines={1}>{task.subtitle}</Text>
        </View>
        <View style={[pb.timerBadge, { borderColor: C.amber + '40', backgroundColor: glow(C.amber, 7) }]}>
          <MaterialIcons name="timer" size={10} color={C.amber} />
          <Text style={{ fontFamily: MONO, fontSize: 9, color: C.amber, fontWeight: '900' }}>
            {timeLeft}m
          </Text>
        </View>
      </View>

      {/* Safety note */}
      <View style={[pb.safetyBox, { borderColor: C.green + '30', backgroundColor: glow(C.green, 5) }]}>
        <MaterialIcons name="shield" size={12} color={C.green} />
        <Text style={pb.safetyTxt}>{task.safetyNote}</Text>
      </View>

      {/* Impact badges */}
      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap', paddingHorizontal: PAD, paddingBottom: 8 }}>
        <ImpactBadge
          label={task.diskImpact === 'read' ? 'READ ONLY' : task.diskImpact === 'delete' ? 'MOVES FILES' : task.diskImpact === 'write' ? 'WRITES DATA' : 'NO DISK'}
          icon={task.diskImpact === 'read' ? 'eye-outline' : task.diskImpact === 'delete' ? 'recycle' : 'harddisk'}
          color={task.diskImpact === 'read' ? C.green : task.diskImpact === 'delete' ? C.amber : C.mid}
        />
        <ImpactBadge
          label={task.networkImpact ? 'USES NETWORK' : 'ZERO NETWORK'}
          icon={task.networkImpact ? 'wifi' : 'wifi-off'}
          color={task.networkImpact ? C.amber : C.green}
        />
        <ImpactBadge
          label={task.undoable ? 'UNDO AVAILABLE' : 'NO UNDO'}
          icon={task.undoable ? 'undo-variant' : 'undo-variant'}
          color={task.undoable ? C.green : C.mid}
        />
        <ImpactBadge
          label="FOREGROUND ONLY"
          icon="cellphone-check"
          color={C.cyan}
        />
      </View>

      {/* Not connected warning */}
      {!isConn && (
        <View style={[pb.warnBox, { borderColor: C.red + '35', backgroundColor: glow(C.red, 6) }]}>
          <MaterialIcons name="wifi-off" size={12} color={C.red} />
          <Text style={[pb.warnTxt, { color: C.red }]}>PC not connected — pair from HOME tab before executing</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={pb.actions}>
        <TouchableOpacity
          onPress={() => { haptics.heavy(); onCancel(); }}
          style={[pb.cancelBtn, { borderColor: C.red + '55' }]}
          activeOpacity={0.85}
        >
          <MaterialIcons name="close" size={16} color={C.red} />
          <Text style={[pb.cancelTxt, { color: C.red }]}>CANCEL</Text>
        </TouchableOpacity>
        <Pressable
          onPressIn={() => Animated.spring(scaleA, { toValue: 0.97, tension: 380, friction: 10, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(scaleA, { toValue: 1, tension: 280, friction: 10, useNativeDriver: true }).start()}
          onPress={() => { haptics.heavy(); onExecute(); }}
          disabled={!isConn || executing}
          style={{ flex: 2, opacity: (!isConn || executing) ? 0.4 : 1 }}
        >
          <Animated.View style={[pb.execBtn, { backgroundColor: task.color, transform: [{ scale: scaleA }] }]}>
            {executing
              ? <ActivityIndicator size="small" color="#000" />
              : <MaterialCommunityIcons name="play-circle-outline" size={18} color="#000" />
            }
            <Text style={pb.execTxt}>{executing ? 'RUNNING ON PC...' : 'EXECUTE NOW'}</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const pb = StyleSheet.create({
  root:        { backgroundColor: C.surf, borderWidth: 2, borderRadius: 16, overflow: 'hidden', position: 'relative', marginHorizontal: PAD, marginBottom: 12,
                 ...Platform.select({ ios: { shadowColor: C.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 10 } }) },
  hdr:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingTop: 13, paddingBottom: 10 },
  iconOrb:     { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  orbDot:      { position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: C.surf },
  pendingLabel:{ fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  taskTitle:   { fontFamily: MONO, fontSize: 14, fontWeight: '900', marginTop: 2 },
  taskSub:     { fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 2 },
  timerBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, flexShrink: 0 },
  safetyBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: PAD, marginBottom: 10, borderWidth: 1, borderRadius: 10, padding: 10 },
  safetyTxt:   { fontFamily: MONO, fontSize: 10, color: C.green, flex: 1, lineHeight: 15, fontWeight: '700' },
  warnBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: PAD, marginBottom: 10, borderWidth: 1, borderRadius: 9, padding: 10 },
  warnTxt:     { fontFamily: MONO, fontSize: 10, flex: 1, lineHeight: 15 },
  actions:     { flexDirection: 'row', gap: 10, paddingHorizontal: PAD, paddingBottom: 14, paddingTop: 4 },
  cancelBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 2, borderRadius: 12, paddingVertical: 13 },
  cancelTxt:   { fontFamily: MONO, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
  execBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14,
                 ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 6 } }) },
  execTxt:     { fontFamily: MONO, fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.3 },
});

// ─── TASK DETAIL MODAL ────────────────────────────────────────────
function TaskDetailModal({
  task, visible, onClose, onQueue, isConn, alreadyPending,
}: {
  task: SafeTask | null; visible: boolean;
  onClose: () => void; onQueue: () => void;
  isConn: boolean; alreadyPending: boolean;
}) {
  if (!task) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={tdm.overlay}>
        <View style={tdm.sheet}>
          <View style={[tdm.stripe, { backgroundColor: task.color }]} />
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.dim }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Header */}
            <View style={tdm.hdr}>
              <View style={[tdm.iconOrb, { borderColor: task.color + '60', backgroundColor: glow(task.color, 14) }]}>
                <MaterialCommunityIcons name={task.icon as any} size={28} color={task.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[tdm.title, { color: task.color }]}>{task.title}</Text>
                <Text style={tdm.subtitle}>{task.subtitle}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={tdm.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={17} color={C.mid} />
              </TouchableOpacity>
            </View>

            {/* WHAT THIS TASK DOES */}
            <View style={[tdm.section, { borderColor: task.color + '30', backgroundColor: glow(task.color, 5) }]}>
              <View style={tdm.sectionHdr}>
                <MaterialIcons name="info-outline" size={13} color={task.color} />
                <Text style={[tdm.sectionLabel, { color: task.color }]}>WHAT THIS TASK DOES</Text>
              </View>
              <Text style={tdm.descTxt}>{task.description}</Text>
            </View>

            {/* SAFETY NOTE */}
            <View style={[tdm.section, { borderColor: C.green + '30', backgroundColor: glow(C.green, 5) }]}>
              <View style={tdm.sectionHdr}>
                <MaterialIcons name="verified-user" size={13} color={C.green} />
                <Text style={[tdm.sectionLabel, { color: C.green }]}>SAFETY GUARANTEE</Text>
              </View>
              <Text style={[tdm.descTxt, { color: C.green + 'CC' }]}>{task.safetyNote}</Text>
            </View>

            {/* IMPACT SUMMARY */}
            <View style={[tdm.section, { borderColor: C.border }]}>
              <View style={tdm.sectionHdr}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={13} color={C.cyan} />
                <Text style={[tdm.sectionLabel, { color: C.cyan }]}>IMPACT SUMMARY</Text>
              </View>
              {[
                { icon: 'harddisk',      label: 'Disk Impact',    value: task.diskImpact === 'read' ? 'Read-only — no changes' : task.diskImpact === 'delete' ? 'Moves files (Recycle Bin)' : task.diskImpact === 'write' ? 'Writes data' : 'None', color: task.diskImpact === 'read' ? C.green : task.diskImpact === 'delete' ? C.amber : C.mid },
                { icon: 'wifi-off',      label: 'Network Access', value: task.networkImpact ? 'Used' : 'Zero network access', color: task.networkImpact ? C.amber : C.green },
                { icon: 'undo-variant',  label: 'Undo Available', value: task.undoable ? 'Yes — files recoverable from Recycle Bin' : 'No — but impact is minimal', color: task.undoable ? C.green : C.mid },
                { icon: 'cellphone',     label: 'Background Run', value: 'NEVER — foreground only', color: C.green },
                { icon: 'account-check', label: 'Admin Rights',   value: task.requiresAdmin ? 'Required' : 'Not required', color: task.requiresAdmin ? C.amber : C.green },
                { icon: 'shield-lock',   label: 'Code Source',    value: 'Hardcoded, non-editable, hash-verified', color: C.green },
              ].map((row, i) => (
                <View key={i} style={[tdm.impactRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                  <MaterialCommunityIcons name={row.icon as any} size={13} color={row.color} style={{ flexShrink: 0 }} />
                  <Text style={tdm.impactLabel}>{row.label}</Text>
                  <Text style={[tdm.impactValue, { color: row.color }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            {/* SECURITY LAYERS */}
            <View style={[tdm.section, { borderColor: C.purple + '30', backgroundColor: glow(C.purple, 4) }]}>
              <View style={tdm.sectionHdr}>
                <MaterialCommunityIcons name="shield-check" size={13} color={C.purple} />
                <Text style={[tdm.sectionLabel, { color: C.purple }]}>6 SECURITY GUARDS BEFORE EXECUTION</Text>
              </View>
              {[
                'Foreground check — app must be on screen and active',
                'Integrity hash — task code SHA-256 verified (detects tampering)',
                'Static safety scan — 40+ threat patterns re-checked',
                'Connection guard — requires live, authenticated server',
                'Rate limiter — max executions per day enforced',
                'Expiry check — task auto-cancels after 1 hour if not run',
              ].map((guard, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: i === 0 ? 0 : 7 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: C.purple + '55', backgroundColor: glow(C.purple, 10), alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.purple }}>{i + 1}</Text>
                  </View>
                  <Text style={[tdm.guardTxt]}>{guard}</Text>
                </View>
              ))}
            </View>

            {/* PLAY STORE COMPLIANCE NOTE */}
            <View style={[tdm.complianceBox, { borderColor: C.blue + '30', backgroundColor: glow(C.blue, 5) }]}>
              <MaterialCommunityIcons name="google-play" size={14} color={C.blue} />
              <View style={{ flex: 1 }}>
                <Text style={[tdm.complianceTitle, { color: C.blue }]}>PLAY STORE COMPLIANCE</Text>
                <Text style={tdm.complianceTxt}>
                  This task is fully hardcoded — no user-created scripts, no background execution, 
                  no undisclosed actions. Every execution requires a foreground tap. 
                  Full disclosure in Play Store listing and Privacy Policy.
                </Text>
              </View>
            </View>

            {/* Estimated time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: PAD, marginBottom: 14 }}>
              <MaterialIcons name="timer" size={12} color={C.mid} />
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>
                Estimated time: ~{Math.round(task.estimatedMs / 1000)} seconds
              </Text>
            </View>

            {/* Action */}
            {alreadyPending ? (
              <View style={[tdm.alreadyPending, { borderColor: task.color + '40', backgroundColor: glow(task.color, 8) }]}>
                <PulseDot color={task.color} size={6} />
                <Text style={[tdm.alreadyPendingTxt, { color: task.color }]}>
                  This task is already pending execution. See the banner above to execute or cancel.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => { haptics.heavy(); onQueue(); }}
                style={[tdm.queueBtn, { backgroundColor: task.color, opacity: !isConn ? 0.45 : 1 }]}
                disabled={!isConn}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="clock-check-outline" size={18} color="#000" />
                <Text style={tdm.queueBtnTxt}>{isConn ? 'QUEUE TASK' : 'PAIR PC FIRST'}</Text>
              </TouchableOpacity>
            )}
            {!isConn && (
              <Text style={{ fontFamily: MONO, fontSize: 10, color: C.red, textAlign: 'center', marginTop: 8, marginHorizontal: PAD }}>
                Connect your PC from the HOME tab before queuing tasks.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const tdm = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: C.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%', overflow: 'hidden' },
  stripe:          { height: 4 },
  hdr:             { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 12 },
  iconOrb:         { width: 56, height: 56, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:           { fontFamily: MONO, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  subtitle:        { fontFamily: MONO, fontSize: 10, color: C.mid, marginTop: 3 },
  closeBtn:        { width: 32, height: 32, borderRadius: 9, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  section:         { marginHorizontal: PAD, marginBottom: 10, borderWidth: 1.5, borderRadius: 13, overflow: 'hidden', padding: 13 },
  sectionHdr:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  sectionLabel:    { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  descTxt:         { fontFamily: MONO, fontSize: 11.5, color: C.text, lineHeight: 19 },
  impactRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  impactLabel:     { fontFamily: MONO, fontSize: 10.5, color: C.mid, flex: 1 },
  impactValue:     { fontFamily: MONO, fontSize: 10.5, fontWeight: '900', textAlign: 'right', flexShrink: 0, maxWidth: '50%' },
  guardTxt:        { fontFamily: MONO, fontSize: 10.5, color: C.mid, flex: 1, lineHeight: 16 },
  complianceBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: PAD, marginBottom: 12, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  complianceTitle: { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  complianceTxt:   { fontFamily: MONO, fontSize: 10, color: C.mid, lineHeight: 16 },
  alreadyPending:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: PAD, marginBottom: 12, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  alreadyPendingTxt: { fontFamily: MONO, fontSize: 10.5, flex: 1, lineHeight: 16, fontWeight: '700' },
  queueBtn:        { marginHorizontal: PAD, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 15,
                     ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }, android: { elevation: 6 } }) },
  queueBtnTxt:     { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000' },
});

// ─── EXECUTION OUTPUT PANEL ───────────────────────────────────────
function ExecutionOutputModal({
  visible, task, running, success, output, error, lines, durationMs,
  onClose,
}: {
  visible: boolean; task: SafeTask | null; running: boolean;
  success: boolean | null; output: string; error: string;
  lines: string[]; durationMs: number | null;
  onClose: () => void;
}) {
  if (!task) return null;
  const sc = running ? C.cyan : success ? C.green : C.red;
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={eom.overlay}>
        <View style={eom.sheet}>
          <View style={[eom.stripe, { backgroundColor: sc }]} />
          <View style={eom.hdr}>
            <View style={[eom.icon, { borderColor: sc + '55', backgroundColor: glow(sc, 12) }]}>
              {running
                ? <ActivityIndicator size="small" color={sc} />
                : <MaterialIcons name={success ? 'check-circle' : 'error'} size={20} color={sc} />
              }
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[eom.title, { color: sc }]} numberOfLines={1}>{task.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <PulseDot color={sc} size={5} />
                <Text style={[eom.status, { color: sc }]}>
                  {running ? 'EXECUTING ON YOUR PC...' : success ? `COMPLETED · ${durationMs}ms` : `FAILED · ${durationMs}ms`}
                </Text>
              </View>
            </View>
            {!running && (
              <TouchableOpacity onPress={onClose} style={eom.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={15} color={C.mid} />
              </TouchableOpacity>
            )}
          </View>

          {/* Compliance notice in output */}
          {!running && (
            <View style={[eom.complianceNote, { borderColor: C.green + '25', backgroundColor: glow(C.green, 4) }]}>
              <MaterialIcons name="verified" size={11} color={C.green} />
              <Text style={eom.complianceNoteTxt}>
                Safe Schedule task — hardcoded, hash-verified, foreground-only. 
                Audit entry saved locally.
              </Text>
            </View>
          )}

          <View style={[eom.outputBox, { borderColor: sc + '30' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sc }} />
              <Text style={{ fontFamily: MONO, fontSize: 9, fontWeight: '900', color: sc, flex: 1, letterSpacing: 1 }}>
                {running ? 'LIVE OUTPUT' : 'EXECUTION OUTPUT'}
              </Text>
              {durationMs !== null && !running && (
                <Text style={{ fontFamily: MONO, fontSize: 9, color: C.mid }}>{durationMs}ms</Text>
              )}
            </View>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
              {running ? (
                lines.slice(-20).map((l, i) => (
                  <Text key={i} style={eom.outputLine}>{l}</Text>
                ))
              ) : (
                <>
                  {output ? <Text style={eom.outputText} selectable>{output}</Text> : null}
                  {error  ? <Text style={[eom.outputText, { color: '#FF8888' }]} selectable>{error}</Text> : null}
                  {!output && !error ? (
                    <View style={{ alignItems: 'center', paddingVertical: 18, gap: 7 }}>
                      <MaterialIcons name="check-circle-outline" size={26} color={C.mid} />
                      <Text style={{ fontFamily: MONO, fontSize: 11, color: C.mid }}>Task completed with no output.</Text>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>

          {!running && (
            <TouchableOpacity onPress={onClose} style={[eom.doneBtn, { backgroundColor: sc }]} activeOpacity={0.85}>
              <MaterialIcons name="check" size={17} color="#000" />
              <Text style={eom.doneTxt}>DONE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const eom = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: C.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%', overflow: 'hidden' },
  stripe:          { height: 4 },
  hdr:             { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  icon:            { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:           { fontFamily: MONO, fontSize: 14, fontWeight: '900' },
  status:          { fontFamily: MONO, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  closeBtn:        { width: 30, height: 30, borderRadius: 9, backgroundColor: C.surf2, alignItems: 'center', justifyContent: 'center' },
  complianceNote:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: PAD, marginVertical: 8, borderWidth: 1, borderRadius: 9, padding: 9 },
  complianceNoteTxt: { fontFamily: MONO, fontSize: 9.5, color: C.green, flex: 1, lineHeight: 14 },
  outputBox:       { margin: PAD, borderWidth: 1.5, borderRadius: 13, overflow: 'hidden' },
  outputLine:      { fontFamily: MONO, fontSize: 10, color: C.mid, lineHeight: 16 },
  outputText:      { fontFamily: MONO, fontSize: 12, color: '#88FF99', lineHeight: 19 },
  doneBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: PAD, marginBottom: 20, borderRadius: 14, paddingVertical: 14 },
  doneTxt:         { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: '#000' },
});

// ─── AUDIT LOG PANEL ─────────────────────────────────────────────
function AuditLogPanel({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <View style={al.root}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <MaterialCommunityIcons name="history" size={11} color={C.mid} />
        <Text style={al.hdr}>EXECUTION HISTORY</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
        <Text style={{ fontFamily: MONO, fontSize: 8, color: C.dim }}>{entries.length} ENTRIES</Text>
      </View>
      {entries.slice(0, 5).map((e, i) => {
        const date = new Date(e.ts);
        const timeStr = `${date.toLocaleDateString()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
        const sc = e.blocked ? C.amber : e.success ? C.green : C.red;
        return (
          <View key={i} style={[al.row, i < entries.slice(0,5).length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc, flexShrink: 0, marginTop: 5 }} />
            <View style={{ flex: 1 }}>
              <Text style={[al.name, { color: sc + 'CC' }]} numberOfLines={1}>{e.taskTitle || 'Unknown task'}</Text>
              <Text style={al.time}>{timeStr} · {e.durationMs}ms{e.blocked ? ' · BLOCKED' : ''}</Text>
            </View>
            <MaterialIcons
              name={e.blocked ? 'block' : e.success ? 'check-circle' : 'error'}
              size={14} color={sc + '80'}
            />
          </View>
        );
      })}
    </View>
  );
}
const al = StyleSheet.create({
  root: { backgroundColor: C.surf2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginHorizontal: PAD, marginBottom: 8 },
  hdr:  { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: C.mid, letterSpacing: 1.2 },
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  name: { fontFamily: MONO, fontSize: 11, fontWeight: '700', lineHeight: 16 },
  time: { fontFamily: MONO, fontSize: 9, color: C.dim, marginTop: 2 },
});

// ─── MAIN EXPORTED COMPONENT ──────────────────────────────────────
interface Props {
  isConn: boolean;
}

export default function SafeSchedulePanel({ isConn }: Props) {
  const [pending,    setPending]    = useState<PendingTask | null>(null);
  const [detailTask, setDetailTask] = useState<SafeTask | null>(null);
  const [executing,  setExecuting]  = useState(false);
  const [outputVis,  setOutputVis]  = useState(false);
  const [execState,  setExecState]  = useState<{
    running: boolean; success: boolean | null;
    output: string; error: string; lines: string[]; durationMs: number | null;
  }>({ running: false, success: null, output: '', error: '', lines: [], durationMs: null });
  const [auditLog,   setAuditLog]   = useState<AuditEntry[]>([]);
  const [expanded,   setExpanded]   = useState(false);

  // Run integrity check at mount
  useEffect(() => {
    const check = safeScheduleEngine.verifyIntegrity();
    if (!check.allOk) {
      console.error('[BUTLER SAFE SCHEDULE] INTEGRITY FAILURE:', check.failures);
      // Show non-dismissable alert if tampering detected
      Alert.alert(
        'SECURITY ALERT',
        'Safe Schedule task code integrity verification failed. This may indicate app tampering. Safe Schedule is disabled until the app is reinstalled.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const reload = useCallback(async () => {
    const p = await safeScheduleEngine.getPending();
    setPending(p);
    const log = await safeScheduleEngine.getAuditLog();
    setAuditLog(log);
  }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 10_000);  // refresh every 10s (expiry check)
    return () => clearInterval(interval);
  }, [reload]);

  const handleQueue = useCallback(async (task: SafeTask) => {
    haptics.heavy();
    const result = await safeScheduleEngine.queueTask(task.id);
    if (!result.ok) {
      Alert.alert('Cannot Queue Task', result.reason || 'Unknown error');
      return;
    }
    await reload();
    setDetailTask(null);
  }, [reload]);

  const handleCancel = useCallback(async () => {
    haptics.medium();
    Alert.alert(
      'Cancel Task?',
      `Cancel the pending task "${pending ? SAFE_TASKS.find(t => t.id === pending.taskId)?.title : ''}"?`,
      [
        { text: 'Keep It', style: 'cancel' },
        { text: 'CANCEL TASK', style: 'destructive', onPress: async () => {
          await safeScheduleEngine.cancelPending();
          await reload();
          haptics.success();
        }},
      ]
    );
  }, [pending, reload]);

  const handleExecute = useCallback(async () => {
    if (!isConn) {
      Alert.alert('Not Connected', 'Pair your PC from the HOME tab before executing tasks.');
      return;
    }
    // Final AppState guard on the UI side too
    if (AppState.currentState !== 'active') {
      Alert.alert('App Not Active', 'Please keep the app in the foreground while executing tasks.');
      return;
    }
    const task = pending ? SAFE_TASKS.find(t => t.id === pending.taskId) : null;
    if (!task) return;

    haptics.heavy();

    // Confirmation dialog with FULL explanation
    Alert.alert(
      `Execute: ${task.title}`,
      `${task.description}\n\nSafety Note: ${task.safetyNote}\n\nThis will run on your paired PC right now.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'EXECUTE NOW',
          style: 'default',
          onPress: async () => {
            setExecuting(true);
            setExecState({ running: true, success: null, output: '', error: '', lines: [], durationMs: null });
            setOutputVis(true);

            const ip    = serverConnection.getIP()    || '';
            const port  = serverConnection.getPort()  || '';
            const token = serverConnection.getToken() || '';

            const result = await safeScheduleEngine.executePending(
              { ip, port, token },
              (line) => setExecState(p => ({ ...p, lines: [...p.lines.slice(-25), line] }))
            );

            setExecuting(false);
            setExecState(p => ({
              ...p,
              running:    false,
              success:    result.success,
              output:     result.output,
              error:      result.blocked ? (result.blockReason || result.error) : result.error,
              durationMs: result.durationMs,
            }));
            await reload();
            haptics[result.success ? 'success' : 'warning']();

            if (result.blocked) {
              Alert.alert(
                'Execution Blocked',
                `A security guard blocked this task:\n\n${result.blockReason || result.error}`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [pending, isConn, reload]);

  const pendingTask = pending ? SAFE_TASKS.find(t => t.id === pending.taskId) : null;

  return (
    <View>
      {/* ─── SECTION HEADER ─────────────────────────────────────── */}
      <View style={ss.sectionHdr}>
        <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.teal }} />
        <MaterialCommunityIcons name="shield-lock" size={12} color={C.teal} />
        <Text style={ss.sectionLabel}>SAFE SCHEDULE</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: C.teal + '20' }} />
        <View style={[ss.complianceBadge, { borderColor: C.green + '45', backgroundColor: glow(C.green, 8) }]}>
          <MaterialCommunityIcons name="google-play" size={9} color={C.green} />
          <Text style={{ fontFamily: MONO, fontSize: 7.5, color: C.green, fontWeight: '900' }}>PLAY STORE COMPLIANT</Text>
        </View>
        <TouchableOpacity
          onPress={() => setExpanded(e => !e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={18} color={C.mid} />
        </TouchableOpacity>
      </View>

      {/* ─── PENDING TASK BANNER (always shown if pending) ──────── */}
      {pending && pendingTask ? (
        <PendingBanner
          pending={pending}
          task={pendingTask}
          onCancel={handleCancel}
          onExecute={handleExecute}
          isConn={isConn}
          executing={executing}
        />
      ) : null}

      {/* ─── COLLAPSED / EXPANDED PANEL ─────────────────────────── */}
      {!expanded && !pending ? (
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          style={[ss.collapsedPill, { borderColor: C.teal + '35' }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="shield-lock" size={12} color={C.teal} />
          <Text style={{ fontFamily: MONO, fontSize: 10, color: C.teal, fontWeight: '700' }}>
            {SAFE_TASKS.length} pre-approved maintenance tasks — tap to view
          </Text>
          <MaterialIcons name="chevron-right" size={14} color={C.teal + '70'} />
        </TouchableOpacity>
      ) : expanded ? (
        <>
          {/* Transparency notice */}
          <View style={[ss.noticeBox, { borderColor: C.blue + '30', backgroundColor: glow(C.blue, 5) }]}>
            <MaterialCommunityIcons name="information" size={13} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Text style={[ss.noticeTitle, { color: C.blue }]}>WHAT IS SAFE SCHEDULE?</Text>
              <Text style={ss.noticeTxt}>
                5 pre-approved, non-editable maintenance tasks. All task code is hardcoded inside 
                the app and hash-verified before each run. No background execution — ever. 
                Every task requires your explicit tap to execute. Full undo support where available.
              </Text>
            </View>
          </View>

          {/* Task cards */}
          {SAFE_TASKS.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isPending={pending?.taskId === task.id}
              onPress={() => setDetailTask(task)}
              isConn={isConn}
            />
          ))}

          {/* Audit log */}
          <AuditLogPanel entries={auditLog} />

          {/* Play Store compliance footer */}
          <View style={[ss.footerNote, { borderColor: C.green + '25' }]}>
            <MaterialIcons name="verified-user" size={11} color={C.green + '80'} />
            <Text style={ss.footerTxt}>
              Safe Schedule is fully compliant with Google Play's automation policies. 
              No background services. No undisclosed actions. Every execution is foreground-only 
              and requires an explicit user tap.
            </Text>
          </View>
        </>
      ) : null}

      {/* ─── MODALS ──────────────────────────────────────────────── */}
      <TaskDetailModal
        task={detailTask}
        visible={!!detailTask}
        onClose={() => setDetailTask(null)}
        onQueue={() => detailTask && handleQueue(detailTask)}
        isConn={isConn}
        alreadyPending={!!pending && pending.taskId === detailTask?.id}
      />
      <ExecutionOutputModal
        visible={outputVis}
        task={pendingTask}
        running={execState.running}
        success={execState.success}
        output={execState.output}
        error={execState.error}
        lines={execState.lines}
        durationMs={execState.durationMs}
        onClose={() => setOutputVis(false)}
      />
    </View>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────
const TaskCard = React.memo(function TaskCard({
  task, isPending, onPress, isConn,
}: {
  task: SafeTask; isPending: boolean; onPress: () => void; isConn: boolean;
}) {
  const scaleA = useRef(new Animated.Value(1)).current;
  const pi = () => Animated.spring(scaleA, { toValue: 0.97, tension: 380, friction: 12, useNativeDriver: true }).start();
  const po = () => Animated.spring(scaleA, { toValue: 1,    tension: 280, friction: 10, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pi} onPressOut={po} style={{ marginHorizontal: PAD, marginBottom: 8 }}>
      <Animated.View style={[tc.root, { borderColor: isPending ? task.color + '70' : task.color + '25', transform: [{ scale: scaleA }] }]}>
        <View style={[tc.leftBar, { backgroundColor: task.color }]} />
        {isPending && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, backgroundColor: task.color + '80' }} />}
        <View style={tc.content}>
          {/* Icon + title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <View style={[tc.iconBox, { borderColor: task.color + '55', backgroundColor: glow(task.color, 12) }]}>
              <MaterialCommunityIcons name={task.icon as any} size={20} color={task.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tc.title, { color: task.color }]} numberOfLines={1}>{task.title}</Text>
              <Text style={tc.subtitle} numberOfLines={1}>{task.subtitle}</Text>
            </View>
            {isPending ? (
              <View style={[tc.pendingBadge, { borderColor: C.amber + '55', backgroundColor: glow(C.amber, 10) }]}>
                <PulseDot color={C.amber} size={5} />
                <Text style={{ fontFamily: MONO, fontSize: 8, fontWeight: '900', color: C.amber }}>PENDING</Text>
              </View>
            ) : null}
          </View>
          {/* Meta row */}
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={[tc.metaChip, { borderColor: task.color + '30' }]}>
              <MaterialCommunityIcons name="lock" size={9} color={task.color + '90'} />
              <Text style={[tc.metaTxt, { color: task.color + '80' }]}>HARDCODED</Text>
            </View>
            <View style={[tc.metaChip, { borderColor: task.color + '30' }]}>
              <MaterialIcons name="verified" size={9} color={task.color + '90'} />
              <Text style={[tc.metaTxt, { color: task.color + '80' }]}>HASH-VERIFIED</Text>
            </View>
            <View style={[tc.metaChip, { borderColor: task.diskImpact === 'read' ? C.green + '30' : C.amber + '30' }]}>
              <MaterialCommunityIcons name={task.diskImpact === 'read' ? 'eye-outline' : 'recycle'} size={9} color={task.diskImpact === 'read' ? C.green + '90' : C.amber + '90'} />
              <Text style={[tc.metaTxt, { color: task.diskImpact === 'read' ? C.green + '80' : C.amber + '80' }]}>
                {task.diskImpact === 'read' ? 'READ ONLY' : task.diskImpact === 'delete' ? 'MOVES FILES' : 'SAFE'}
              </Text>
            </View>
            {task.undoable && (
              <View style={[tc.metaChip, { borderColor: C.green + '30' }]}>
                <MaterialCommunityIcons name="undo-variant" size={9} color={C.green + '90'} />
                <Text style={[tc.metaTxt, { color: C.green + '80' }]}>UNDO</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ paddingRight: 12, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="chevron-right" size={18} color={task.color + '60'} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

const tc = StyleSheet.create({
  root:        { flexDirection: 'row', alignItems: 'stretch', backgroundColor: C.surf, borderRadius: 13, borderWidth: 1, overflow: 'hidden', position: 'relative',
                 ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 4 } }) },
  leftBar:     { width: 4, alignSelf: 'stretch' },
  content:     { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  iconBox:     { width: 42, height: 42, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontFamily: MONO, fontSize: 13, fontWeight: '900', lineHeight: 17 },
  subtitle:    { fontFamily: MONO, fontSize: 9.5, color: C.mid, marginTop: 2 },
  pendingBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  metaChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  metaTxt:     { fontFamily: MONO, fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
});

const ss = StyleSheet.create({
  sectionHdr:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 10 },
  sectionLabel:  { fontFamily: MONO, fontSize: 9.5, fontWeight: '900', color: C.teal + 'CC', letterSpacing: 1.5 },
  complianceBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  collapsedPill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: PAD, marginBottom: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.surf },
  noticeBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: PAD, marginBottom: 12, borderWidth: 1.5, borderRadius: 13, padding: 13 },
  noticeTitle:   { fontFamily: MONO, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  noticeTxt:     { fontFamily: MONO, fontSize: 10.5, color: C.mid, lineHeight: 17 },
  footerNote:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: PAD, marginBottom: 14, marginTop: 4, borderWidth: 1, borderRadius: 10, padding: 10 },
  footerTxt:     { fontFamily: MONO, fontSize: 9.5, color: C.dim, flex: 1, lineHeight: 15 },
});
