import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
  nexushome: 'home-outline',
  scripts: 'code-slash-outline',
  butler: 'chatbubbles-outline',
  knowledge: 'library-outline',
  logs: 'pulse-outline',
  builder: 'build-outline',
  fileshare: 'folder-open-outline',
  downloads: 'cloud-download-outline',
  connect: 'link-outline',
  cosmetic: 'color-palette-outline',
  settings: 'settings-outline',
};

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="nexushome"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6CC3FF',
        tabBarInactiveTintColor: '#7F8EA8',
        tabBarStyle: {
          backgroundColor: '#0A101D',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconByRoute[route.name] ?? 'ellipse-outline'} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="nexushome" options={{ title: 'Home' }} />
      <Tabs.Screen name="scripts" options={{ title: 'Scripts' }} />
      <Tabs.Screen name="butler" options={{ title: 'Butler' }} />
      <Tabs.Screen name="knowledge" options={{ title: 'Knowledge' }} />
      <Tabs.Screen name="logs" options={{ title: 'Logs' }} />
      <Tabs.Screen name="builder" options={{ title: 'Builder' }} />
      <Tabs.Screen name="fileshare" options={{ title: 'Files' }} />
      <Tabs.Screen name="downloads" options={{ title: 'Downloads' }} />
      <Tabs.Screen name="connect" options={{ title: 'Connect' }} />
      <Tabs.Screen name="cosmetic" options={{ title: 'Cosmetic' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
