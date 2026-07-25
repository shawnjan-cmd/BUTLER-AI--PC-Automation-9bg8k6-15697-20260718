import React, { memo, useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
  nexushome: 'home-outline',
  scripts: 'code-slash-outline',
  butler: 'sparkles-outline',
  knowledge: 'library-outline',
  logs: 'pulse-outline',
  builder: 'construct-outline',
  fileshare: 'folder-open-outline',
  downloads: 'cloud-download-outline',
  connect: 'link-outline',
  cosmetic: 'color-palette-outline',
  settings: 'settings-outline',
};

const labelByRoute: Record<string, string> = {
  nexushome: 'Home',
  scripts: 'Scripts',
  butler: 'Butler',
  knowledge: 'Knowledge',
  logs: 'Logs',
  builder: 'Builder',
  fileshare: 'Files',
  downloads: 'Downloads',
  connect: 'Connect',
  cosmetic: 'Theme',
  settings: 'Settings',
};

const hiddenRoutes = new Set(['onboarding', 'index']);

function NeoTabBarImpl({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');

  const visibleRoutes = useMemo(
    () => state.routes.filter((route) => !hiddenRoutes.has(route.name)),
    [state.routes]
  );

  const activeName = state.routes[state.index]?.name;
  if (hiddenRoutes.has(activeName)) {
    return null;
  }

  const submitDraft = useCallback(() => {
    const message = draft.trim();
    Keyboard.dismiss();
    if (!message) {
      navigation.navigate('butler');
      return;
    }
    setDraft('');
    router.push({ pathname: '/(tabs)/butler', params: { q: message } } as any);
  }, [draft, navigation]);

  return (
    <View style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}> 
      <View style={s.chatStrip}>
        <Ionicons name="sparkles-outline" size={18} color="#86D3FF" />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask Butler anything..."
          placeholderTextColor="#87A2C8"
          style={s.input}
          returnKeyType="send"
          onSubmitEditing={submitDraft}
          blurOnSubmit
        />
        <Pressable style={s.askButton} onPress={submitDraft}>
          <Text style={s.askButtonText}>Ask</Text>
        </Pressable>
      </View>

      <View style={s.toolbar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.toolbarScroll}
          keyboardShouldPersistTaps="handled"
        >
          {visibleRoutes.map((route) => {
            const routeIndex = state.routes.findIndex((r) => r.key === route.key);
            const isFocused = state.index === routeIndex;
            const options = descriptors[route.key]?.options;
            const label =
              typeof options?.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options?.title === 'string'
                  ? options.title
                  : labelByRoute[route.name] ?? route.name;

            return (
              <Pressable
                key={route.key}
                style={[s.tabButton, isFocused && s.tabButtonActive]}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({ type: 'tabLongPress', target: route.key });
                }}
              >
                <Ionicons
                  name={iconByRoute[route.name] ?? 'ellipse-outline'}
                  size={17}
                  color={isFocused ? '#C6EEFF' : '#7D8EA8'}
                />
                <Text style={[s.tabLabel, isFocused && s.tabLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export const NeoTabBar = memo(NeoTabBarImpl);

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: '#05070D',
    paddingHorizontal: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  chatStrip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(126,211,255,0.34)',
    backgroundColor: '#0C182A',
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: '#EAF5FF',
    fontSize: 14,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
  },
  askButton: {
    borderRadius: 10,
    backgroundColor: '#6CC3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  askButtonText: {
    color: '#05101B',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  toolbar: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0B1220',
    overflow: 'hidden',
  },
  toolbarScroll: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
  },
  tabButton: {
    minWidth: 78,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(108,195,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(143,219,255,0.45)',
  },
  tabLabel: {
    color: '#7D8EA8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#E8F8FF',
  },
});
