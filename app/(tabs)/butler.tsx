import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '@/services/appPreferences';
import { type ChatMessage, newMessage, sendChat } from '@/services/chat';
import { loadConfig, testServerConnection } from '@/services/connection';

const starter = newMessage('assistant', 'Butler online. Ask me to automate or diagnose your connected PC workflows.');

export default function ButlerScreen() {
  const params = useLocalSearchParams<{ q?: string }>();

  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [draft, setDraft] = useState('');
  const [model, setModel] = useState(DEFAULT_PREFERENCES.defaultModel);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PREFERENCES.systemPrompt);
  const [status, setStatus] = useState('Ready');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void (async () => {
      const prefs = await loadPreferences();
      setModel(prefs.defaultModel);
      setSystemPrompt(prefs.systemPrompt);
    })();
  }, []);

  const quickPrompt = useMemo(() => String(params.q ?? '').trim(), [params.q]);

  useEffect(() => {
    if (!quickPrompt) return;
    setDraft(quickPrompt);
  }, [quickPrompt]);

  const pushUserPrompt = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || sending) return;

    setSending(true);
    setStatus('Checking server…');

    try {
      const cfg = await loadConfig();
      if (!cfg.host) {
        throw new Error('No server configured. Open Connect and save your endpoint first.');
      }

      const health = await testServerConnection(cfg);
      if (!health.ok) {
        throw new Error(health.error || 'Server is unreachable.');
      }

      const userMsg = newMessage('user', prompt);
      const outbound = [...messages, userMsg];
      setMessages(outbound);
      setDraft('');
      setStatus('Generating response…');

      const answer = await sendChat(cfg, outbound, {
        model: model.trim() || DEFAULT_PREFERENCES.defaultModel,
        systemPrompt,
      });

      setMessages((prev) => [...prev, newMessage('assistant', answer)]);
      setStatus(`Connected (${health.latencyMs ?? 0}ms)`);

      await savePreferences({
        defaultModel: model.trim() || DEFAULT_PREFERENCES.defaultModel,
        systemPrompt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected chat failure';
      setStatus(`Error: ${message}`);
      setMessages((prev) => [...prev, newMessage('assistant', `I couldn't complete that request: ${message}`)]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <Text style={s.eyebrow}>LIVE BUTLER</Text>
          <Text style={s.title}>AI Operations Chat</Text>
          <Text style={s.sub}>Model and system prompt are fully editable and persisted.</Text>
        </View>

        <View style={s.controls}>
          <View style={s.controlBlock}>
            <Text style={s.label}>Model</Text>
            <TextInput
              style={s.controlInput}
              value={model}
              onChangeText={setModel}
              autoCapitalize="none"
              placeholder="llama3.1:8b"
              placeholderTextColor="#6A85A8"
            />
          </View>
          <View style={s.controlBlock}>
            <Text style={s.label}>System prompt</Text>
            <TextInput
              style={[s.controlInput, s.controlInputMultiline]}
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              multiline
              placeholder="Set assistant behavior"
              placeholderTextColor="#6A85A8"
            />
          </View>
        </View>

        <ScrollView style={s.chat} contentContainerStyle={s.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map((message) => (
            <View key={message.id} style={[s.bubble, message.role === 'user' ? s.bubbleUser : s.bubbleAssistant]}>
              <Text style={s.bubbleRole}>{message.role === 'user' ? 'YOU' : 'BUTLER'}</Text>
              <Text style={s.bubbleText}>{message.content}</Text>
            </View>
          ))}
          {sending ? (
            <View style={s.typingRow}>
              <ActivityIndicator color="#8AD8FF" />
              <Text style={s.typingText}>Butler is thinking…</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={s.composerWrap}>
          <Text style={s.status}>{status}</Text>
          <View style={s.composerRow}>
            <TextInput
              style={s.composerInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask Butler to do something practical…"
              placeholderTextColor="#6F87A8"
              multiline
            />
            <Pressable style={[s.sendButton, sending && s.sendButtonDisabled]} onPress={() => void pushUserPrompt(draft)} disabled={sending}>
              <Text style={s.sendButtonText}>{sending ? '...' : 'Send'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#03060C' },
  flex: { flex: 1 },
  header: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(103,205,255,0.42)',
    backgroundColor: '#081425',
    padding: 14,
    gap: 6,
  },
  eyebrow: { color: '#84D4FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  sub: { color: '#B8CCE6', fontSize: 12 },
  controls: { marginHorizontal: 16, marginTop: 10, gap: 8 },
  controlBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#101B30',
    padding: 10,
    gap: 6,
  },
  label: { color: '#D2E6FD', fontSize: 11, fontWeight: '800' },
  controlInput: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#13213A',
    color: '#ECF6FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  controlInputMultiline: { minHeight: 58, textAlignVertical: 'top' },
  chat: { flex: 1, marginTop: 10 },
  chatContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 9 },
  bubble: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  bubbleAssistant: { borderColor: 'rgba(130,207,255,0.32)', backgroundColor: '#10243A' },
  bubbleUser: { borderColor: 'rgba(53,220,186,0.38)', backgroundColor: '#11342E', marginLeft: 34 },
  bubbleRole: { color: '#90B8DC', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  bubbleText: { color: '#EAF5FF', fontSize: 13, lineHeight: 19 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  typingText: { color: '#9FC0E0', fontSize: 12 },
  composerWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    gap: 7,
  },
  status: { color: '#98B8D8', fontSize: 11 },
  composerRow: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#101C31',
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    color: '#EAF5FF',
    maxHeight: 110,
    fontSize: 14,
    textAlignVertical: 'top',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  sendButton: {
    borderRadius: 9,
    backgroundColor: '#79D7FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#07111E', fontWeight: '900', fontSize: 12 },
});
