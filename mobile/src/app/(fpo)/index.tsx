import React, { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, ProgressBar, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { t } from '@/i18n';
import {
  formatRelativeTime,
  getGradeColor,
  getStatusColor,
} from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

const { width } = Dimensions.get('window');

export default function FPODashboardScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();
  
  const currentFpo = fpo || { id: 1, name: 'Wai FPO' };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  if (loading || !stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Compute total lots for percentage
  const totalGradeLots = Object.values(stats.lots_by_grade).reduce((a: any, b: any) => a + b, 0) || 1;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'intake': return 'package-down';
      case 'dispatch': return 'truck-delivery';
      case 'qc': return 'clipboard-check';
      case 'market': return 'storefront';
      default: return 'bell';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {currentFpo.name} Dashboard
          </Text>
          <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
            Real-time warehouse operations
          </Text>
        </View>

        {/* 2x2 Metric Grid */}
        <View style={styles.grid}>
          <Card
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            elevation={1}
            onPress={() => router.push('/(fpo)/intake-list' as any)}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={styles.emoji}>🌾</Text>
              <Text style={[styles.val, { color: colors.text }]}>
                {Number(stats.total_stock_mt).toFixed(1)} MT
              </Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Total Stock</Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            elevation={1}
            onPress={() => router.push('/(fpo)/intake-list' as any)}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={styles.emoji}>📦</Text>
              <Text style={[styles.val, { color: colors.text }]}>{stats.total_lots}</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Active Lots</Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            elevation={1}
            onPress={() => router.push('/(fpo)/farmers-dir' as any)}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={styles.emoji}>🧑‍🌾</Text>
              <Text style={[styles.val, { color: colors.text }]}>{stats.total_farmers}</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Registered Farmers</Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.gridCard, { backgroundColor: colors.card }]}
            elevation={1}
            onPress={() => router.push('/(fpo)/warehouses' as any)}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={styles.emoji}>🏢</Text>
              <Text style={[styles.val, { color: colors.text }]}>{stats.total_warehouses}</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Warehouses</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Grade Distribution */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Grade Distribution
            </Text>
            {Object.entries(stats.lots_by_grade).length === 0 && (
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No graded lots yet.</Text>
            )}
            {Object.entries(stats.lots_by_grade).map(([grade, count]: [string, any]) => {
              const color = getGradeColor(grade);
              const progress = count / Number(totalGradeLots);
              return (
                <View key={grade} style={styles.distributionRow}>
                  <View style={styles.distTextRow}>
                    <Text style={[styles.distName, { color: colors.text }]}>
                      {grade.replace('grade_', 'Grade ').toUpperCase()}
                    </Text>
                    <Text style={[styles.distVal, { color: colors.text }]}>
                      {count} ({Math.round(progress * 100)}%)
                    </Text>
                  </View>
                  <ProgressBar progress={progress} color={color} style={styles.progressBar} />
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Status Overview */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Status Overview
            </Text>
            <View style={styles.chipContainer}>
              {Object.entries(stats.lots_by_status).length === 0 && (
                <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No active lots yet.</Text>
              )}
              {Object.entries(stats.lots_by_status).map(([status, count]: [string, any]) => {
                const color = getStatusColor(status);
                return (
                  <Surface key={status} style={[styles.statusItem, { backgroundColor: color + '15' }]} elevation={0}>
                    <Text style={[styles.statusName, { color }]}>
                      {status.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={[styles.statusCount, { color: colors.text }]}>
                      {count}
                    </Text>
                  </Surface>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Recent Operations Activity Feed */}
        <Text style={[styles.feedTitle, { color: colors.text }]}>
          Recent Activities
        </Text>
        {stats.recent_activity.length === 0 && (
          <Text style={{ color: colors.textSecondary, marginLeft: Spacing.sm }}>No recent activity.</Text>
        )}
        {stats.recent_activity.map((activity: any) => (
          <View key={activity.id} style={[styles.activityRow, { borderBottomColor: colors.divider }]}>
            <Avatar.Icon
              size={36}
              icon={getActivityIcon(activity.type)}
              style={{ backgroundColor: colors.primarySurface }}
              color={colors.primary}
            />
            <View style={styles.activityTextContainer}>
              <Text style={[styles.activityMsg, { color: colors.text }]} numberOfLines={2}>
                {activity.message.replace(/<[^>]+>/g, '')}
              </Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                {formatRelativeTime(activity.created_at)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  header: { marginBottom: Spacing.xl },
  title: { fontSize: FontSize.xl, fontWeight: '700' },
  subTitle: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md, marginBottom: Spacing.xl },
  gridCard: { width: (width - Spacing.xl * 2 - Spacing.md) / 2, borderRadius: BorderRadius.lg },
  cardContent: { alignItems: 'center', padding: Spacing.md },
  emoji: { fontSize: 24, marginBottom: Spacing.xs },
  val: { fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' },
  label: { fontSize: 11, textAlign: 'center', marginTop: Spacing.xs },
  sectionCard: { borderRadius: BorderRadius.lg, marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.lg },
  distributionRow: { marginBottom: Spacing.md },
  distTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  distName: { fontSize: FontSize.xs, fontWeight: '600' },
  distVal: { fontSize: FontSize.xs },
  progressBar: { height: 6, borderRadius: BorderRadius.sm },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusItem: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', minWidth: '30%', flex: 1 },
  statusName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: Spacing.xs },
  statusCount: { fontSize: FontSize.md, fontWeight: '700' },
  feedTitle: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.lg, marginTop: Spacing.md },
  activityRow: { flexDirection: 'row', paddingVertical: Spacing.lg, borderBottomWidth: 1, gap: Spacing.md },
  activityTextContainer: { flex: 1 },
  activityMsg: { fontSize: FontSize.sm, lineHeight: 18 },
  activityTime: { fontSize: FontSize.xs, marginTop: Spacing.xs },
});
