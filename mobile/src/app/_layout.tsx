import React, { useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AuthProvider, useAuth } from '@/store/authStore';
import { LanguageProvider } from '@/i18n';
import { NetworkProvider } from '@/store/networkStore';

function NavigationGate() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Force segment to generic string to avoid TS type literal conflicts
    const rootSegment = segments[0] as string;

    const inFarmerGroup = rootSegment === '(farmer)';
    const inFpoGroup = rootSegment === '(fpo)';
    const inLoginScreen = rootSegment === 'login';

    if (!isAuthenticated) {
      // If not logged in, force navigation to the login screen
      if (!inLoginScreen) {
        router.replace('/login' as any);
      }
    } else {
      // If logged in, redirect based on their role
      if (user?.role === 'farmer') {
        if (!inFarmerGroup) {
          router.replace('/(farmer)' as any);
        }
      } else if (user?.role === 'fpo_staff' || user?.role === 'fpo_manager') {
        if (!inFpoGroup) {
          router.replace('/(fpo)' as any);
        }
      } else {
        // Fallback or admin
        if (!inFpoGroup && !inFarmerGroup) {
          router.replace('/login' as any);
        }
      }
    }
  }, [isAuthenticated, isLoading, user, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAF5' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <NetworkProvider>
      <LanguageProvider>
        <AuthProvider>
          <PaperProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <NavigationGate />
            </ThemeProvider>
          </PaperProvider>
        </AuthProvider>
      </LanguageProvider>
    </NetworkProvider>
  );
}
