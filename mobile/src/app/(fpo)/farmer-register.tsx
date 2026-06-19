import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/types';
import api from '@/utils/api';

export default function FarmerRegisterScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();
  const { t } = useTranslation();

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const temp: Record<string, string> = {};

    // Full Name: Required, length >= 3
    if (!formData.full_name.trim()) {
      temp.full_name = 'Name is required';
    } else if (formData.full_name.trim().length < 3) {
      temp.full_name = 'Name must be at least 3 characters';
    }

    // Phone: Required, exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    const cleanPhone = formData.phone.replace(/[\s\-()]/g, '');
    if (!formData.phone) {
      temp.phone = 'Phone number is required';
    } else if (!phoneRegex.test(cleanPhone)) {
      temp.phone = 'Phone number must be exactly 10 digits';
    }

    // Email: Optional, valid format
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        temp.email = 'Enter a valid email address';
      }
    }

    // Aadhaar: Required, exactly 12 digits
    if (!formData.aadhaar.trim()) {
      temp.aadhaar = 'Aadhaar card is required';
    } else {
      const aadhaarRegex = /^[0-9]{12}$/;
      if (!aadhaarRegex.test(formData.aadhaar.trim())) {
        temp.aadhaar = 'Aadhaar must be exactly 12 digits';
      }
    }

    // Village: Required
    if (!formData.village.trim()) {
      temp.village = 'Village is required';
    }

    // Bank Account: Optional, 9 to 18 digits
    if (formData.bank_account.trim()) {
      const bankRegex = /^[0-9]{9,18}$/;
      if (!bankRegex.test(formData.bank_account.trim())) {
        temp.bank_account = 'Bank account must be between 9 and 18 digits';
      }
    }

    // Bank IFSC: Optional, valid IFSC format
    if (formData.bank_ifsc.trim()) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(formData.bank_ifsc.trim().toUpperCase())) {
        temp.bank_ifsc = 'Enter a valid 11-digit IFSC code (e.g. SBIN0001234)';
      }
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Alert.alert(t('common.error') || 'Error', 'Please correct the highlighted validation errors.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        password: 'password123', // Default temporary password
        email: formData.email.trim() || null,
        role: UserRole.FARMER,
        fpo_id: fpo?.id || 1,
        aadhaar: formData.aadhaar.trim() || null,
        village: formData.village.trim() || null,
        bank_account: formData.bank_account.trim() || null,
        bank_ifsc: formData.bank_ifsc.trim() ? formData.bank_ifsc.trim().toUpperCase() : null,
      };

      await api.post('/api/auth/register', payload);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        aadhaar: '',
        village: '',
        bank_account: '',
        bank_ifsc: '',
      });
      setErrors({});
      Alert.alert(t('common.success') || 'Success', 'Farmer registered successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to register farmer', error);
      Alert.alert(t('common.error') || 'Registration Failed', error.response?.data?.detail || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('fpo.registerFarmer')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('fpo.farmerDetails')}</Text>
              
              <TextInput
                mode="outlined"
                label={`${t('auth.fullName')} *`}
                value={formData.full_name}
                onChangeText={(text) => {
                  setFormData({ ...formData, full_name: text });
                  if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
                }}
                error={!!errors.full_name}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.full_name && <HelperText type="error" visible={!!errors.full_name} style={styles.helperText}>{errors.full_name}</HelperText>}

              <TextInput
                mode="outlined"
                label={`${t('auth.phone')} *`}
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                }}
                keyboardType="phone-pad"
                maxLength={10}
                error={!!errors.phone}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.phone && <HelperText type="error" visible={!!errors.phone} style={styles.helperText}>{errors.phone}</HelperText>}

              <TextInput
                mode="outlined"
                label={`${t('auth.email')} (Optional)`}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.email && <HelperText type="error" visible={!!errors.email} style={styles.helperText}>{errors.email}</HelperText>}

              <TextInput
                mode="outlined"
                label={`${t('auth.aadhaar')} *`}
                value={formData.aadhaar}
                onChangeText={(text) => {
                  setFormData({ ...formData, aadhaar: text });
                  if (errors.aadhaar) setErrors(prev => ({ ...prev, aadhaar: '' }));
                }}
                keyboardType="numeric"
                maxLength={12}
                error={!!errors.aadhaar}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.aadhaar && <HelperText type="error" visible={!!errors.aadhaar} style={styles.helperText}>{errors.aadhaar}</HelperText>}

              <TextInput
                mode="outlined"
                label={`${t('auth.village')} *`}
                value={formData.village}
                onChangeText={(text) => {
                  setFormData({ ...formData, village: text });
                  if (errors.village) setErrors(prev => ({ ...prev, village: '' }));
                }}
                error={!!errors.village}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.village && <HelperText type="error" visible={!!errors.village} style={styles.helperText}>{errors.village}</HelperText>}

              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.md }]}>{t('fpo.bankInfo')}</Text>

              <TextInput
                mode="outlined"
                label={`${t('auth.bankAccount')} (Optional)`}
                value={formData.bank_account}
                onChangeText={(text) => {
                  setFormData({ ...formData, bank_account: text });
                  if (errors.bank_account) setErrors(prev => ({ ...prev, bank_account: '' }));
                }}
                keyboardType="numeric"
                error={!!errors.bank_account}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.bank_account && <HelperText type="error" visible={!!errors.bank_account} style={styles.helperText}>{errors.bank_account}</HelperText>}

              <TextInput
                mode="outlined"
                label={`${t('auth.bankIfsc')} (Optional)`}
                value={formData.bank_ifsc}
                onChangeText={(text) => {
                  setFormData({ ...formData, bank_ifsc: text });
                  if (errors.bank_ifsc) setErrors(prev => ({ ...prev, bank_ifsc: '' }));
                }}
                autoCapitalize="characters"
                error={!!errors.bank_ifsc}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.bank_ifsc && <HelperText type="error" visible={!!errors.bank_ifsc} style={styles.helperText}>{errors.bank_ifsc}</HelperText>}

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
                {t('fpo.registerFarmer')}
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
  input: { marginBottom: Spacing.xs, backgroundColor: 'transparent' },
  helperText: { marginBottom: Spacing.sm, marginTop: -Spacing.xs },
  btn: { marginTop: Spacing.lg, borderRadius: BorderRadius.md },
});
