/**
 * Wakhar WMS — FPO Settings Screen
 * Operations settings, navigation menu redirects, and session logout.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
} from 'react-native';
import { Text, Card, Avatar, Divider, List, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { AVAILABLE_LOCALES, useTranslation } from '@/i18n';
import { useAuth } from '@/store/authStore';

export default function FPOSettingsScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { user, fpo, logout } = useAuth();
  const { locale, setLocale, t } = useTranslation();

  const currentUser = user || { full_name: 'Rajesh Bhosale', role: 'fpo_manager' };
  const currentFpo = fpo || { name: 'Wai FPO', code: 'WAI-FPO' };

  const initials = currentUser.full_name
    ? currentUser.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RB';

  const [menuVisible, setMenuVisible] = useState(false);

  const handleLanguageChange = (langCode: 'en' | 'mr' | 'hi') => {
    setLocale(langCode);
    setMenuVisible(false);
    Alert.alert(t('profile.languageUpdated'), t('profile.languageChangedSuccessfully'));
  };

  const handleLogout = async () => {
    await logout();
  };

  const currentLangLabel = AVAILABLE_LOCALES.find(l => l.code === locale)?.nativeLabel || 'English';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={60}
              label={initials}
              style={{ backgroundColor: colors.primary }}
              labelStyle={{ color: colors.onPrimary, fontWeight: '700' }}
            />
            <View style={styles.profileTextContainer}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {currentUser.full_name}
              </Text>
              <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
                {t('fpoMore.role')} {currentUser.role.replace('fpo_', '').toUpperCase()}
              </Text>
              <Text style={[styles.profileFpo, { color: colors.primary, fontWeight: '600' }]}>
                🏢 {currentFpo.name} ({currentFpo.code})
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Directory Menus */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content style={{ paddingVertical: 0 }}>
            <List.Item
              title={t('fpoMore.intakeLedger')}
              description={t('fpoMore.intakeLedgerDesc')}
              left={props => <List.Icon {...props} icon="clipboard-text-multiple" color={colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(fpo)/intake-list' as any)}
              titleStyle={{ color: colors.text, fontWeight: '600' }}
              descriptionStyle={{ color: colors.textSecondary }}
            />

            <Divider />

            <List.Item
              title={t('fpoMore.withdrawalRequests')}
              description={t('fpoMore.withdrawalRequestsDesc')}
              left={props => <List.Icon {...props} icon="hand-pointing-right" color={colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(fpo)/withdrawals' as any)}
              titleStyle={{ color: colors.text, fontWeight: '600' }}
              descriptionStyle={{ color: colors.textSecondary }}
            />

            <Divider />

            <List.Item
              title={t('fpoMore.farmerDirectory')}
              description={t('fpoMore.farmerDirectoryDesc')}
              left={props => <List.Icon {...props} icon="account-group" color={colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(fpo)/farmers-dir' as any)}
              titleStyle={{ color: colors.text, fontWeight: '600' }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
            
            <Divider />

            <List.Item
              title={t('fpoMore.warehouseOverview')}
              description={t('fpoMore.warehouseOverviewDesc')}
              left={props => <List.Icon {...props} icon="warehouse" color={colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/(fpo)/warehouses' as any)}
              titleStyle={{ color: colors.text, fontWeight: '600' }}
              descriptionStyle={{ color: colors.textSecondary }}
            />
          </Card.Content>
        </Card>

        {/* Settings Menu */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content style={{ paddingVertical: 0 }}>
            {/* Language Selection */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <List.Item
                  title={t('fpoMore.appLanguage')}
                  description={currentLangLabel}
                  left={props => <List.Icon {...props} icon="translate" color={colors.primary} />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => setMenuVisible(true)}
                  titleStyle={{ color: colors.text, fontWeight: '600' }}
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

            {/* Logout Row */}
            <List.Item
              title={t('fpoMore.logout')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  card: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  profileRole: {
    fontSize: FontSize.xs,
    marginVertical: 2,
  },
  profileFpo: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});
