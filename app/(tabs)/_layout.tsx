import React from 'react';
import { Tabs } from 'expo-router';
import { NeoTabBar } from '@/components/ui/NeoTabBar';

const TAB_BG = '#05070D';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="nexushome"
      tabBar={(props) => <NeoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: TAB_BG },
      }}
    >
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="nexushome" options={{ title: 'Home' }} />
      <Tabs.Screen name="butler" options={{ title: 'Butler' }} />
      <Tabs.Screen name="connect" options={{ title: 'Connect' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
