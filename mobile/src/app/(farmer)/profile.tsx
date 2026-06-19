import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import { Text, Card, Avatar, Button, Menu, Divider, List, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { AVAILABLE_LOCALES, useTranslation } from '@/i18n';
import { maskAadhaar } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FarmerProfileScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { farmerProfile, logout } = useAuth();

  const farmer = farmerProfile || ({} as any);
  const initials = farmer.name ? farmer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'SP';

  const [menuVisible, setMenuVisible] = useState(false);
  const { locale, setLocale, t } = useTranslation();
  const [linkedFpo, setLinkedFpo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFpo = async () => {
      if (farmer.fpo_id) {
        try {
          const res = await api.get(`/api/fpos/${farmer.fpo_id}`);
          setLinkedFpo(res.data);
        } catch (err) {
          console.error('Failed to load FPO', err);
        }
      }
      setLoading(false);
    };
    fetchFpo();
  }, [farmer.fpo_id]);

  const handleLanguageChange = (langCode: 'en' | 'mr' | 'hi') => {
    setLocale(langCode);
    setMenuVisible(false);
    Alert.alert(t('profile.languageUpdated'), t('profile.languageChangedSuccessfully'));
  };

  const handleLogout = async () => {
    await logout();
  };

  const currentLangLabel = AVAILABLE_LOCALES.find(l => l.code === locale)?.nativeLabel || 'English';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: colors.primary }}
            labelStyle={{ color: colors.onPrimary, fontSize: 32, fontWeight: '700' }}
          />
          <Text style={[styles.profileName, { color: colors.text }]}>
            {farmer.name || t('common.noData')}
          </Text>
          <Text style={[styles.profileCode, { color: colors.textSecondary }]}>
            {t('profile.farmerId')} {farmer.farmer_code || '—'}
          </Text>
        </View>

        {/* Personal Details Card */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('profile.personalDetails')}
            </Text>
            <InfoRow label={t('profile.mobilePhone')} value={farmer.phone || 'N/A'} />
            <InfoRow label={t('profile.villageLocation')} value={farmer.village || 'N/A'} />
            <InfoRow label={t('profile.aadhaarCard')} value={farmer.aadhaar ? maskAadhaar(farmer.aadhaar) : 'N/A'} />
          </Card.Content>
        </Card>

        {/* Bank Account Details */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t('profile.bankDetailsTitle')}
            </Text>
            <InfoRow label={t('profile.bankAccount')} value={farmer.bank_account ? 'XXXX-XXXX-' + farmer.bank_account.slice(-4) : 'N/A'} />
            <InfoRow label={t('profile.ifscCode')} value={farmer.bank_ifsc || 'N/A'} />
          </Card.Content>
        </Card>

        {/* FPO Registration */}
        {linkedFpo && (
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('profile.registeredFpo')}
              </Text>
              <InfoRow label={t('profile.fpoName')} value={linkedFpo.name} />
              <InfoRow label={t('profile.fpoCode')} value={linkedFpo.code} />
              <InfoRow label={t('profile.regionState')} value={`${linkedFpo.district || ''}, ${linkedFpo.state || ''}`} />
            </Card.Content>
          </Card>
        )}

        {/* Settings list */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content style={{ paddingVertical: 0 }}>
            {/* Language Selection */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <List.Item
                  title={t('profile.appLanguage')}
                  description={currentLangLabel}
                  left={props => <List.Icon {...props} icon="translate" color={colors.primary} />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => setMenuVisible(true)}
                  titleStyle={{ color: colors.text }}
                  descriptionStyle={{ color: colors.textSecondary }}
                />
              }
            >
              {AVAILABLE_LOCALES.map(loc => (
                <Menu.Item
                  key={loc.code}
                  onPress={() => handleLanguageChange(loc.code as 'en' | 'mr' | 'hi')}
                  title={loc.nativeLabel}
                  titleStyle={{ color: locale === loc.code ? colors.primary : colors.text }}
                />
              ))}
            </Menu>

            <Divider />

            {/* Change Password Row */}
            <List.Item
              title={t('profile.changePassword')}
              titleStyle={{ color: colors.text, fontWeight: '600' }}
              left={props => <List.Icon {...props} icon="lock-reset" color={colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(farmer)/change-password' as any)}
            />

            <Divider />

            {/* Logout Row */}
            <List.Item
              title={t('profile.logout')}
              titleStyle={{ color: colors.error, fontWeight: '600' }}
              left={props => <List.Icon {...props} icon="logout" color={colors.error} />}
              onPress={handleLogout}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoVal, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  profileHeader: { alignItems: 'center', marginVertical: Spacing.xl },
  profileName: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.md },
  profileCode: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm },
  infoVal: { fontSize: FontSize.sm, fontWeight: '600' },
});
