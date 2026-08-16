import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ButlerWordmark from './ButlerWordmark';

export interface ServerConsolePanelProps {
  isConnected: boolean;
  cpu: number;
  ram: number;
  disk: number;
  kbCount: number;
  learningActive?: boolean;
  queuePending?: number;
  workersRunning?: number;
  onPair?: () => void;
  onOpenLogs?: () => void;
}

type Tone = 'ok' | 'warn' | 'dim';

function clamp(n: number) { return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0)); }
function toneFor(value: number): Tone { return value >= 85 ? 'warn' : 'ok'; }
function toneColor(tone: Tone) { return tone === 'warn' ? '#FFB43D' : tone === 'ok' ? '#2FE38A' : '#71809A'; }

function Metric({ icon, label, value, suffix = '%', tone }: { icon: string; label: string; value: number; suffix?: string; tone: Tone }) {
  const pct = clamp(value);
  const color = toneColor(tone);
  return (
    <View style={S.metric} accessible accessibilityLabel={`${label} ${Math.round(pct)}${suffix}`}>
      <View style={S.metricHead}>
        <MaterialCommunityIcons name={icon as any} size={13} color={color} />
        <Text style={S.metricLabel}>{label}</Text>
        <Text style={[S.metricValue, { color }]}>{Math.round(pct)}{suffix}</Text>
      </View>
      <View style={S.track}><View style={[S.fill, { width: `${pct}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

function Step({ icon, label, state, tone }: { icon: string; label: string; state: string; tone: Tone }) {
  const color = toneColor(tone);
  return (
    <View style={S.step} accessible accessibilityLabel={`${label}: ${state}`}>
      <View style={[S.stepIcon, { borderColor: color + '70', backgroundColor: color + '12' }]}>
        <MaterialCommunityIcons name={icon as any} size={13} color={color} />
      </View>
      <Text style={S.stepLabel} numberOfLines={1}>{label}</Text>
      <Text style={[S.stepState, { color }]}>{state}</Text>
    </View>
  );
}

export default function ServerConsolePanel({ isConnected, cpu, ram, disk, kbCount, learningActive = false, queuePending = 0, workersRunning = 0, onPair, onOpenLogs }: ServerConsolePanelProps) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.95, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.35, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pressure = Math.max(clamp(cpu), clamp(ram), clamp(disk)) >= 85;
  const statusTone: Tone = !isConnected ? 'dim' : pressure ? 'warn' : 'ok';
  const status = !isConnected ? 'OFFLINE' : pressure ? 'GUARDED' : 'NOMINAL';
  const statusColor = toneColor(statusTone);

  return (
    <View style={S.root}>
      <View style={S.header}>
        <View style={{ flex: 1 }}>
          <View style={S.eyebrow}><Animated.View style={[S.liveDot, { backgroundColor: statusColor, opacity: isConnected ? pulse : 0.5 }]} /><Text style={S.eyebrowText}>PYTHON SERVER · VISUAL CONSOLE</Text></View>
          <ButlerWordmark compact accent="#38D9E8" />
        </View>
        <View style={[S.status, { borderColor: statusColor + '70', backgroundColor: statusColor + '12' }]}>
          <Text style={[S.statusText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>

      <View style={S.metrics}>
        <Metric icon="chip" label="CPU" value={cpu} tone={!isConnected ? 'dim' : toneFor(cpu)} />
        <Metric icon="memory" label="RAM" value={ram} tone={!isConnected ? 'dim' : toneFor(ram)} />
        <Metric icon="harddisk" label="DISK" value={disk} tone={!isConnected ? 'dim' : toneFor(disk)} />
      </View>

      <View style={S.flowHeader}>
        <Text style={S.flowTitle}>AUTHORIZED MEMORY FLOW</Text>
        <Text style={S.flowMeta}>{isConnected ? `${kbCount} FINDINGS` : 'PAIR TO INSPECT'}</Text>
      </View>
      <View style={S.flow}>
        <Step icon="qrcode-scan" label="PAIR" state={isConnected ? 'AUTH' : 'WAIT'} tone={isConnected ? 'ok' : 'dim'} />
        <View style={S.connector} />
        <Step icon="shield-check-outline" label="SCOPE" state={isConnected ? 'READY' : 'LOCK'} tone={isConnected ? 'ok' : 'dim'} />
        <View style={S.connector} />
        <Step icon="spider" label="CRAWL" state={pressure ? 'PAUSED' : learningActive ? `${queuePending}Q/${workersRunning}W` : 'IDLE'} tone={pressure ? 'warn' : learningActive ? 'ok' : isConnected ? 'warn' : 'dim'} />
        <View style={S.connector} />
        <Step icon="lock-outline" label="ENCRYPT" state={isConnected ? 'AEAD' : 'LOCK'} tone={isConnected ? 'ok' : 'dim'} />
        <View style={S.connector} />
        <Step icon="graph-outline" label="INDEX" state={isConnected ? 'LOCAL' : 'WAIT'} tone={isConnected ? 'ok' : 'dim'} />
      </View>

      <View style={S.footer}>
        <View style={{ flex: 1 }}>
          <Text style={S.footerTitle}>{!isConnected ? 'Connect the paired PC to inspect live operations.' : pressure ? 'Optional research is guarded; chat and scripts remain protected.' : learningActive ? 'Research workers are active under the optional-work governor.' : 'Core services protected · optional research is separately governed.'}</Text>
          <Text style={S.footerSub}>No fabricated activity · status reflects the latest server response.</Text>
        </View>
        {!isConnected && onPair ? <TouchableOpacity onPress={onPair} style={S.button} activeOpacity={0.8}><Text style={S.buttonText}>PAIR PC</Text></TouchableOpacity> : null}
        {isConnected && onOpenLogs ? <TouchableOpacity onPress={onOpenLogs} style={S.iconButton} activeOpacity={0.8} accessibilityLabel="Open server logs"><MaterialCommunityIcons name="text-box-search-outline" size={16} color="#38D9E8" /></TouchableOpacity> : null}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { backgroundColor: '#0B0F17', borderRadius: 14, borderWidth: 1, borderColor: '#38D9E836', padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrowText: { color: '#71809A', fontFamily: 'monospace', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  status: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontFamily: 'monospace', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, gap: 5 },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricLabel: { flex: 1, color: '#71809A', fontFamily: 'monospace', fontSize: 8, fontWeight: '900' },
  metricValue: { fontFamily: 'monospace', fontSize: 9, fontWeight: '900' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: '#1A2230' },
  fill: { height: 4, borderRadius: 2 },
  flowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  flowTitle: { color: '#38D9E8', fontFamily: 'monospace', fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  flowMeta: { color: '#71809A', fontFamily: 'monospace', fontSize: 7.5, fontWeight: '900' },
  flow: { flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, alignItems: 'center', gap: 3, minWidth: 0 },
  stepIcon: { width: 27, height: 27, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { color: '#DCE6F2', fontFamily: 'monospace', fontSize: 7, fontWeight: '900' },
  stepState: { fontFamily: 'monospace', fontSize: 6.5, fontWeight: '900' },
  connector: { height: 1, flex: 0.35, backgroundColor: '#38D9E83D', marginBottom: 22 },
  footer: { borderTopWidth: 1, borderTopColor: '#1A2230', paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerTitle: { color: '#DCE6F2', fontFamily: 'monospace', fontSize: 8, fontWeight: '900' },
  footerSub: { color: '#71809A', fontFamily: 'monospace', fontSize: 7, marginTop: 3 },
  button: { borderWidth: 1, borderColor: '#38D9E870', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  buttonText: { color: '#38D9E8', fontFamily: 'monospace', fontSize: 8, fontWeight: '900' },
  iconButton: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: '#38D9E860', alignItems: 'center', justifyContent: 'center' },
});
