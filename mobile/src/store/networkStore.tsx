/**
 * Network State Provider — detects connectivity changes using @react-native-community/netinfo.
 * Exposes an `isOffline` boolean and renders a global offline banner.
 * Triggers sync queue processing when transitioning from offline → online.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { processSyncQueue } from '@/utils/syncManager';

interface NetworkContextProps {
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextProps>({ isOffline: false });

export function useNetwork() {
  return useContext(NetworkContext);
}

function OfflineBanner({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const bannerHeight = 36 + insets.top;
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: visible ? bannerHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, bannerHeight]);

  return (
    <Animated.View style={[
      styles.banner, 
      { 
        height: heightAnim, 
        overflow: 'hidden'
      }
    ]}>
      <View style={{ paddingTop: insets.top, height: bannerHeight, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Text style={styles.bannerText}>🔴 You are offline. Changes will sync when connected.</Text>
      </View>
    </Animated.View>
  );
}

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);

      setIsOffline(offline);

      // Detect transition from offline → online and trigger sync
      if (wasOffline.current && !offline) {
        console.log('[NetworkProvider] Back online — processing sync queue...');
        processSyncQueue().catch((err) =>
          console.error('[NetworkProvider] Sync queue processing failed:', err)
        );
      }

      wasOffline.current = offline;
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isOffline }}>
      <View style={{ flex: 1 }}>
        <OfflineBanner visible={isOffline} />
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
