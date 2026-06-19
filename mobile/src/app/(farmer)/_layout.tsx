/**
 * Wakhar WMS — Farmer Tab Layout
 * Bottom tab navigator for Farmer portal (Home, Deposits, Receipts, Profile)
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getColors } from '@/constants/theme';
import { useTranslation } from '@/i18n';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={styles.emojiIcon}>{emoji}</Text>;
}

export default function FarmerLayout() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home') || 'Home',
          tabBarIcon: ({ color }) => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="deposits"
        options={{
          title: t('tabs.deposits') || 'Deposits',
          tabBarIcon: () => <TabIcon emoji="📦" />,
        }}
      />
      <Tabs.Screen
        name="deposit/[id]"
        options={{
          title: 'Deposit Details',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="receipts"
        options={{
          title: t('tabs.receipts') || 'Receipts',
          tabBarIcon: () => <TabIcon emoji="📜" />,
        }}
      />
      <Tabs.Screen
        name="receipt/[id]"
        options={{
          title: 'Receipt Details',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile') || 'Profile',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  emojiIcon: {
    fontSize: 20,
  },
});
