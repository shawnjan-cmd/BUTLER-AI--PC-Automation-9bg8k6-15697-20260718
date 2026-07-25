import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ButlerScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const quickPrompt = useMemo(() => {
    if (!params.q) return null;
    return String(params.q).trim().slice(0, 120);
  }, [params.q]);

  const previewMessages = useMemo(
    () => [
      { role: 'assistant', text: 'Butler is ready. Ask for scripts, diagnostics, or quick automation plans.' },
      ...(quickPrompt ? [{ role: 'user', text: quickPrompt }] : []),
      {
        role: 'assistant',
        text: quickPrompt
          ? 'Prompt received from the AI bar above the toolbar. Reply can be generated from here next.'
          : 'Use the AI chat bar above the bottom toolbar to send an instant prompt.',
      },
    ],
    [quickPrompt]
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.eyebrow}>AI ASSISTANT</Text>
            <Text style={s.status}>READY</Text>
          </View>
          <Text style={s.title}>Butler Chat Workspace</Text>
          <Text style={s.subtitle}>
            This screen is now visually rebuilt. The quick AI input sits above the toolbar and routes messages here.
          </Text>
        </View>

        <View style={s.chatCard}>
          {previewMessages.map((msg, i) => (
            <View key={`${msg.role}-${i}`} style={[s.bubble, msg.role === 'user' ? s.userBubble : s.assistantBubble]}>
              <Text style={s.bubbleRole}>{msg.role === 'user' ? 'YOU' : 'BUTLER'}</Text>
              <Text style={s.bubbleText}>{msg.text}</Text>
            </View>
          ))}
        </View>

        <View style={s.actionsRow}>
          <Pressable style={s.action}>
            <Text style={s.actionTxt}>Execution Copilot</Text>
          </Pressable>
          <Pressable style={s.action}>
            <Text style={s.actionTxt}>Research Copilot</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#03060C' },
  content: { padding: 16, paddingBottom: 180, gap: 14 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,198,255,0.34)',
    backgroundColor: '#081222',
    padding: 14,
    gap: 7,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#84C8FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  status: {
    color: '#18F0C9',
    borderWidth: 1,
    borderColor: 'rgba(24,240,201,0.45)',
    borderRadius: 999,
    backgroundColor: 'rgba(24,240,201,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: '900',
  },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  subtitle: { color: '#B7CBE8', fontSize: 13, lineHeight: 19 },
  chatCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0B1527',
    padding: 12,
    gap: 10,
  },
  bubble: { borderRadius: 11, borderWidth: 1, padding: 10, gap: 4 },
  assistantBubble: { borderColor: 'rgba(125,182,255,0.34)', backgroundColor: 'rgba(66,116,166,0.18)' },
  userBubble: {
    borderColor: 'rgba(115,243,211,0.35)',
    backgroundColor: 'rgba(24,220,186,0.14)',
    marginLeft: 36,
  },
  bubbleRole: { color: '#8EBCE6', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  bubbleText: { color: '#E9F4FF', fontSize: 13, lineHeight: 18 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,195,255,0.38)',
    backgroundColor: 'rgba(108,195,255,0.14)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionTxt: { color: '#DFF3FF', fontSize: 11, fontWeight: '800' },
});
