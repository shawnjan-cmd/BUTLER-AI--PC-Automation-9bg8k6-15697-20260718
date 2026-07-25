import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_PREFERENCES,
  type AppPreferences,
  loadPreferences,
  resetPreferences,
  savePreferences,
} from '@/services/appPreferences';
import { clearConfig } from '@/services/connection';

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void (async () => {
      const loaded = await loadPreferences();
      setPrefs(loaded);
    })();
  }, []);

  const onSave = async () => {
    await savePreferences(prefs);
    setStatus('Preferences saved.');
    Alert.alert('Saved', 'Default model and system prompt updated.');
  };

  const onReset = async () => {
    await Promise.all([resetPreferences(), clearConfig()]);
    setPrefs(DEFAULT_PREFERENCES);
    setStatus('Connection and AI preferences reset to defaults.');
    Alert.alert('Reset complete', 'Server config and local AI preferences were cleared.');
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.hero}>
          <Text style={s.eyebrow}>SYSTEM SETTINGS</Text>
          <Text style={s.title}>Operational Defaults</Text>
          <Text style={s.subtitle}>Everything here affects the live Butler backend and chat behavior.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Default Model</Text>
          <TextInput
            value={prefs.defaultModel}
            onChangeText={(value) => setPrefs((prev) => ({ ...prev, defaultModel: value }))}
            autoCapitalize="none"
            placeholder="llama3.1:8b"
            placeholderTextColor="#6F87A8"
            style={s.input}
          />

          <Text style={s.label}>System Prompt</Text>
          <TextInput
            value={prefs.systemPrompt}
            onChangeText={(value) => setPrefs((prev) => ({ ...prev, systemPrompt: value }))}
            multiline
            style={[s.input, s.textArea]}
            placeholder="Define how Butler should respond"
            placeholderTextColor="#6F87A8"
          />
        </View>

        {status ? <Text style={s.status}>{status}</Text> : null}

        <View style={s.actions}>
          <Pressable style={s.actionPrimary} onPress={() => void onSave()}>
            <Text style={s.actionPrimaryText}>Save Preferences</Text>
          </Pressable>
          <Pressable style={s.actionDanger} onPress={() => void onReset()}>
            <Text style={s.actionDangerText}>Reset Connection + AI Settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#04070D' },
  content: { padding: 16, paddingBottom: 180, gap: 14 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(109,203,255,0.4)',
    backgroundColor: '#091426',
    padding: 14,
    gap: 7,
  },
  eyebrow: { color: '#85D5FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#BBD0E7', fontSize: 13, lineHeight: 19 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0E182C',
    padding: 12,
    gap: 8,
  },
  label: { color: '#D5E7FC', fontSize: 12, fontWeight: '800' },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: '#12213A',
    color: '#ECF6FF',
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  status: { color: '#9CC0E2', fontSize: 12 },
  actions: { gap: 8 },
  actionPrimary: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(55,228,196,0.55)',
    backgroundColor: 'rgba(35,215,180,0.18)',
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionPrimaryText: { color: '#E8FCF7', fontWeight: '900', fontSize: 12 },
  actionDanger: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,130,130,0.55)',
    backgroundColor: 'rgba(220,84,84,0.18)',
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionDangerText: { color: '#FFE6E6', fontWeight: '900', fontSize: 12 },
});
