import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import api from '@/utils/api';

export default function ChangePasswordScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error') || 'Error', 'Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error') || 'Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error') || 'Error', 'New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      Alert.alert('Success', 'Your password has been changed successfully.', [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to change password', error);
      Alert.alert('Change Failed', error.response?.data?.detail || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('farmerPassword.changePasswordTitle')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <Text style={{ color: colors.textSecondary, marginBottom: Spacing.xl }}>
                {t('farmerPassword.passwordInstructions')}
              </Text>

              <TextInput
                mode="outlined"
                label={t('farmerPassword.currentPassword')}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label={t('farmerPassword.newPassword')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                mode="outlined"
                label={t('farmerPassword.confirmNewPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Button
                mode="contained"
                onPress={handleChangePassword}
                loading={loading}
                disabled={loading}
                style={styles.btn}
                contentStyle={{ paddingVertical: 8 }}
                buttonColor={colors.primary}
              >
                {t('farmerPassword.updatePassword')}
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
  input: { marginBottom: Spacing.lg, backgroundColor: 'transparent' },
  btn: { marginTop: Spacing.md, borderRadius: BorderRadius.md },
});
