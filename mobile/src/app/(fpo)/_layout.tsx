/**
 * Wakhar WMS — FPO Staff/Manager Tab Layout
 * Bottom tab navigator for FPO portal (Dashboard, Intake, Inventory, Dispatches, More)
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { getColors } from '@/constants/theme';
import { t } from '@/i18n';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={styles.emojiIcon}>{emoji}</Text>;
}

export default function FPOLayout() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);

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
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
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
          title: t('tabs.dashboard') || 'Dashboard',
          tabBarIcon: () => <TabIcon emoji="📊" />,
        }}
      />
      
      <Tabs.Screen
        name="intake"
        options={{
          title: t('tabs.intake') || 'Intake',
          tabBarIcon: () => <TabIcon emoji="📥" />,
        }}
      />

      <Tabs.Screen
        name="intake-list"
        options={{
          title: 'Recent Intakes',
          href: null,
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: t('tabs.inventory') || 'Inventory',
          tabBarIcon: () => <TabIcon emoji="📦" />,
        }}
      />

      <Tabs.Screen
        name="lot/[id]"
        options={{
          title: 'Lot Details',
          href: null,
        }}
      />

      <Tabs.Screen
        name="grading"
        options={{
          title: 'QC Grading',
          href: null,
        }}
      />

      <Tabs.Screen
        name="dispatches"
        options={{
          title: t('tabs.dispatch') || 'Dispatches',
          tabBarIcon: () => <TabIcon emoji="🚛" />,
        }}
      />

      <Tabs.Screen
        name="dispatch-create"
        options={{
          title: 'Create Dispatch',
          href: null,
        }}
      />

      <Tabs.Screen
        name="dispatch/[id]"
        options={{
          title: 'Dispatch Details',
          href: null,
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: () => <TabIcon emoji="⚙️" />,
        }}
      />

      <Tabs.Screen
        name="withdrawals"
        options={{
          title: 'Withdrawals',
          href: null,
        }}
      />

      <Tabs.Screen
        name="farmers-dir"
        options={{
          title: 'Farmers',
          href: null,
        }}
      />

      <Tabs.Screen
        name="warehouses"
        options={{
          title: 'Warehouses',
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
