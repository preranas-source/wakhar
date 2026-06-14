/**
 * Wakhar WMS — Login Screen
 * Premium agricultural-themed login with phone + password.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Text, TextInput, Button, Surface, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { t } from '@/i18n';
import { Colors, Spacing, BorderRadius, FontSize, getColors } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { UserRole } from '@/types';

const countryCodes = [
  { code: '+91', name: 'India (IN)' },
  { code: '+1', name: 'United States (US)' },
  { code: '+44', name: 'United Kingdom (UK)' },
  { code: '+971', name: 'United Arab Emirates (UAE)' },
  { code: '+61', name: 'Australia (AU)' },
];

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const router = useRouter();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [codePickerVisible, setCodePickerVisible] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      setError(t('auth.loginError'));
      return;
    }

    setLoading(true);
    setError('');

    // Format phone number to prepend country code if not present
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      const cleanPhone = formattedPhone.replace(/^0+/, ''); // strip any leading zero
      formattedPhone = `${countryCode}${cleanPhone}`;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await login(formattedPhone, password.trim());

    if (success) {
      // Navigation is handled by the root layout based on auth state
    } else {
      setError(t('auth.loginError'));
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Hero Section */}
            <Animated.View
              entering={FadeInUp.delay(100).duration(600)}
              style={styles.heroSection}
            >
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>🌾</Text>
              </View>
              <Text style={styles.heroTitle}>{t('auth.loginTitle')}</Text>
              <Text style={styles.heroSubtitle}>{t('auth.loginSubtitle')}</Text>
            </Animated.View>

            {/* Login Card */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(600)}
              style={styles.cardWrapper}
            >
              <Surface
                style={[styles.loginCard, { backgroundColor: colors.card }]}
                elevation={3}
              >
                <Text
                  style={[styles.cardTitle, { color: colors.text }]}
                >
                  {t('auth.login')}
                </Text>

                {error ? (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorSurface }]}>
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.phoneInputContainer}>
                  {/* Country Code Picker */}
                  <TouchableOpacity
                    style={[
                      styles.codeSelector,
                      { borderColor: colors.border, backgroundColor: colors.background }
                    ]}
                    onPress={() => setCodePickerVisible(true)}
                  >
                    <Text style={[styles.codeText, { color: colors.text }]}>{countryCode}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>▼</Text>
                  </TouchableOpacity>

                  {/* Phone Input */}
                  <TextInput
                    label={t('auth.phone')}
                    placeholder={t('auth.phoneHint')}
                    value={phone}
                    onChangeText={(text: string) => { setPhone(text); setError(''); }}
                    keyboardType="phone-pad"
                    style={styles.phoneInput}
                    mode="outlined"
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    left={<TextInput.Icon icon="phone" />}
                  />
                </View>

                <TextInput
                  label={t('auth.password')}
                  placeholder={t('auth.passwordHint')}
                  value={password}
                  onChangeText={(text: string) => { setPassword(text); setError(''); }}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  mode="outlined"
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.loginButton}
                  buttonColor={colors.primary}
                  contentStyle={styles.loginButtonContent}
                  labelStyle={styles.loginButtonLabel}
                >
                  {t('auth.loginButton')}
                </Button>
              </Surface>
            </Animated.View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Code Picker Modal */}
      <Modal visible={codePickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalCard, { backgroundColor: colors.card }]} elevation={5}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country Code</Text>
              <Button onPress={() => setCodePickerVisible(false)} textColor={colors.primary}>Close</Button>
            </View>
            <Divider style={{ marginVertical: Spacing.sm }} />
            <FlatList
              data={countryCodes}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCodePickerVisible(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: FontSize.md }}>{item.code}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </Surface>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  cardWrapper: {
    width: '100%',
  },
  loginCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['3xl'],
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  errorBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    marginBottom: Spacing.xl,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  codeSelector: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    height: 56,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 6,
  },
  codeText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },
  loginButton: {
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  loginButtonContent: {
    paddingVertical: Spacing.md,
  },
  loginButtonLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '50%',
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  pickerItem: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
