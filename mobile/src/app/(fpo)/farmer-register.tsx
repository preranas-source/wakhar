import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/types';
import api from '@/utils/api';

export default function FarmerRegisterScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    aadhaar: '',
    village: '',
    bank_account: '',
    bank_ifsc: '',
  });

  const handleRegister = async () => {
    if (!formData.full_name || !formData.phone) {
      Alert.alert('Error', 'Name and Phone are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        password: 'password123', // Default temporary password
        email: formData.email || null,
        role: UserRole.FARMER,
        fpo_id: fpo?.id || 1,
        aadhaar: formData.aadhaar || null,
        village: formData.village || null,
        bank_account: formData.bank_account || null,
        bank_ifsc: formData.bank_ifsc || null,
      };

      await api.post('/api/auth/register', payload);
      Alert.alert('Success', 'Farmer registered successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to register farmer', error);
      Alert.alert('Registration Failed', error.response?.data?.detail || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Register New Farmer</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Farmer Details</Text>
              
              <TextInput
                mode="outlined"
                label="Full Name"
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label="Email (Optional)"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label="Aadhaar Card Number"
                value={formData.aadhaar}
                onChangeText={(text) => setFormData({ ...formData, aadhaar: text })}
                keyboardType="numeric"
                maxLength={12}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label="Village / Address"
                value={formData.village}
                onChangeText={(text) => setFormData({ ...formData, village: text })}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.md }]}>Bank Information</Text>

              <TextInput
                mode="outlined"
                label="Bank Account Number"
                value={formData.bank_account}
                onChangeText={(text) => setFormData({ ...formData, bank_account: text })}
                keyboardType="numeric"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label="Bank IFSC Code"
                value={formData.bank_ifsc}
                onChangeText={(text) => setFormData({ ...formData, bank_ifsc: text })}
                autoCapitalize="characters"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: Spacing.sm }}>
                * Default password 'password123' will be assigned.
              </Text>

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.btn}
                contentStyle={{ paddingVertical: 8 }}
                buttonColor={colors.primary}
              >
                Register Farmer
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md, backgroundColor: 'transparent' },
  btn: { marginTop: Spacing.lg, borderRadius: BorderRadius.md },
});
