import React from 'react';
import { Tabs } from 'expo-router';
import { NeoTabBar } from '@/components/ui/NeoTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="nexushome"
      tabBar={(props) => <NeoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#05070D' },
      }}
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
      <Tabs.Screen name="cosmetic" options={{ title: 'Theme' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
