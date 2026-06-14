import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌾</Text>
      <Text style={styles.title}>WAKHAR WMS</Text>
      <ActivityIndicator size="small" color="#2E7D32" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF5',
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#2E7D32',
  },
  spinner: {
    marginTop: 20,
  },
});
