import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createResearchConsent, sigmaNetCrawler } from '@/services/serverCrawler';
import { haptics } from '@/services/haptics';

export default function ResearchCrawlerCard({ onSaved }: { onSaved?: () => void }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Only starts after you press APPROVE + CRAWL.');
  const [tone, setTone] = useState<'idle' | 'ok' | 'warn'>('idle');

  const run = async () => {
    const target = url.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(target)) {
      setTone('warn'); setMessage('Enter a complete http(s) URL. No crawl started.'); haptics.warning(); return;
    }
    setBusy(true); setTone('idle'); setMessage('Validating server, scope, and resource guard…'); haptics.medium();
    try {
      const result = await sigmaNetCrawler.crawlViaRelay({
        url: target,
        domain: 'User-approved research',
        topic: target.slice(0, 90),
        mode: 'fetch',
        maxLinks: 0,
        consent: createResearchConsent('research', [target.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0]]),
      }, (line, kind) => { if (kind === 'warn' || kind === 'error') setMessage(line); });
      if (result.error) {
        setTone('warn'); setMessage(result.error);
      } else {
        setTone('ok'); setMessage(`Saved ${result.wordCount} words with source provenance. Memory refresh recommended.`); setUrl(''); onSaved?.(); haptics.success();
      }
    } catch (error: any) {
      setTone('warn'); setMessage(error?.message || 'Crawler failed safely. No memory was written.');
    } finally { setBusy(false); }
  };

  const accent = tone === 'ok' ? '#2FE38A' : tone === 'warn' ? '#FFB43D' : '#38D9E8';
  return (
    <View style={[S.root, { borderColor: accent + '45' }]}>
      <View style={S.head}>
        <View style={[S.icon, { backgroundColor: accent + '14', borderColor: accent + '45' }]}><MaterialCommunityIcons name="spider" size={16} color={accent} /></View>
        <View style={{ flex: 1 }}><Text style={S.title}>GROW MEMORY · APPROVED RESEARCH</Text><Text style={S.sub}>The PC fetches, sanitizes, deduplicates, encrypts, and indexes this source.</Text></View>
      </View>
      <TextInput value={url} onChangeText={setUrl} placeholder="https://public-source.example/article" placeholderTextColor="#71809A" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={S.input} editable={!busy} accessibilityLabel="Research URL" />
      <View style={S.foot}>
        <Text style={[S.message, { color: accent }]} numberOfLines={2}>{message}</Text>
        <TouchableOpacity onPress={run} disabled={busy} activeOpacity={0.8} style={[S.button, { borderColor: accent + '80', backgroundColor: accent + '12' }]} accessibilityLabel="Approve and crawl research source">
          {busy ? <ActivityIndicator size="small" color={accent} /> : <Text style={[S.buttonText, { color: accent }]}>APPROVE + CRAWL</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { backgroundColor: '#0B0F17', borderRadius: 14, borderWidth: 1, padding: 12, gap: 9 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  icon: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#DCE6F2', fontFamily: 'monospace', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.6 },
  sub: { color: '#71809A', fontFamily: 'monospace', fontSize: 7.5, marginTop: 3, lineHeight: 12 },
  input: { minHeight: 42, borderRadius: 9, borderWidth: 1, borderColor: '#2A3546', color: '#DCE6F2', paddingHorizontal: 10, fontFamily: 'monospace', fontSize: 10 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  message: { flex: 1, fontFamily: 'monospace', fontSize: 7.5, lineHeight: 11 },
  button: { minHeight: 34, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'monospace', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.4 },
});
