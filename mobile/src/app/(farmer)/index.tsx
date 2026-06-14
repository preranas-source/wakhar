import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Avatar, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { t } from '@/i18n';
import { formatWeight, formatDate } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FarmerHomeScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { farmerProfile, user, fpo: linkedFpo } = useAuth();
  
  // Use mock fallback for UI safety if profile is null but user is logged in
  const farmer = farmerProfile || { id: 1, name: user?.full_name || 'Farmer' };

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [lots, setLots] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const fetchData = async () => {
    if (!farmerProfile?.id) return;
    try {
      const [lotsRes, receiptsRes, commRes, whRes] = await Promise.all([
        api.get(`/api/lots?farmer_id=${farmerProfile.id}`),
        api.get(`/api/warehouse-receipts?farmer_id=${farmerProfile.id}`),
        api.get('/api/commodities'),
        api.get('/api/warehouses')
      ]);

      setLots(lotsRes.data);
      setReceipts(receiptsRes.data);
      setCommodities(commRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error('Failed to fetch farmer dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (farmerProfile?.id) {
        fetchData();
      }
    }, [farmerProfile?.id])
  );

  const onRefresh = useCallback(async () => {
    if (!farmerProfile?.id) return;
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [farmerProfile?.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Compute summary stats
  const totalWeight = lots.reduce((sum, lot) => sum + Number(lot.quantity_kg), 0);
  const activeReceipts = receipts.filter(r => r.status === 'active').length;
  const pendingQC = lots.filter(l => l.status === 'qc_pending').length;
  // Sort lots by newest first and take top 3
  const recentLots = [...lots].sort((a, b) => new Date(b.intake_date).getTime() - new Date(a.intake_date).getTime()).slice(0, 3);

  const initials = farmer.name ? farmer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'F';

  const getCommodityById = (id: number) => commodities.find(c => c.id === id);
  const getWarehouseById = (id: number) => warehouses.find(w => w.id === id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t('farmer.greeting', { name: farmer.name }) || 'Namaskar,'}
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {farmer.name}
            </Text>
            {linkedFpo && (
              <Surface style={[styles.fpoBadge, { backgroundColor: colors.primarySurface }]} elevation={0}>
                <Text style={[styles.fpoText, { color: colors.primary }]}>
                  🏢 {linkedFpo.name}
                </Text>
              </Surface>
            )}
          </View>
          <Avatar.Text
            size={50}
            label={initials}
            style={{ backgroundColor: colors.primary }}
            labelStyle={{ color: colors.onPrimary, fontWeight: '700' }}
          />
        </View>

        {/* Metric Summary Cards */}
        <View style={styles.metricsContainer}>
          <Card style={[styles.metricCard, { backgroundColor: colors.card }]} elevation={2}>
            <Card.Content style={styles.metricContent}>
              <Text style={styles.metricEmoji}>🌾</Text>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {formatWeight(totalWeight)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Total Deposits
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: colors.card }]} elevation={2}>
            <Card.Content style={styles.metricContent}>
              <Text style={styles.metricEmoji}>📜</Text>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {activeReceipts}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Active WRs
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: colors.card }]} elevation={2}>
            <Card.Content style={styles.metricContent}>
              <Text style={styles.metricEmoji}>🔍</Text>
              <Text style={[styles.metricVal, { color: colors.text }]}>
                {pendingQC}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Pending QC
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Links Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
        </View>
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            icon="wallet-membership"
            onPress={() => router.push('/(farmer)/receipts' as any)}
            style={[styles.actionBtn, { borderRadius: BorderRadius.lg }]}
            buttonColor={colors.primary}
          >
            View Receipts
          </Button>
          <Button
            mode="outlined"
            icon="history"
            onPress={() => router.push('/(farmer)/deposits' as any)}
            style={[styles.actionBtnOutline, { borderRadius: BorderRadius.lg }]}
            textColor={colors.primary}
          >
            Deposit History
          </Button>
        </View>

        {/* Recent Deposits Feed */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Deposits
          </Text>
          <TouchableOpacity onPress={() => router.push('/(farmer)/deposits' as any)}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentLots.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content style={styles.emptyContent}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No deposits recorded yet.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          recentLots.map(lot => {
            const comm = getCommodityById(lot.commodity_id);
            const wh = getWarehouseById(lot.warehouse_id);
            return (
              <Card
                key={lot.id}
                style={[styles.lotCard, { backgroundColor: colors.card }]}
                elevation={1}
                onPress={() => router.push(`/(farmer)/deposit/${lot.id}` as any)}
              >
                <Card.Content style={styles.lotCardContent}>
                  <View style={styles.lotRow}>
                    <View>
                      <Text style={[styles.lotCode, { color: colors.textSecondary }]}>
                        {lot.lot_code}
                      </Text>
                      <Text style={[styles.commodityName, { color: colors.text }]}>
                        {comm ? comm.name : 'Commodity'} ({lot.variety})
                      </Text>
                    </View>
                    <View style={styles.lotRight}>
                      <Text style={[styles.lotQty, { color: colors.primary, fontWeight: '700' }]}>
                        {formatWeight(lot.quantity_kg)}
                      </Text>
                      <Text style={[styles.lotDate, { color: colors.textSecondary }]}>
                        {formatDate(lot.intake_date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.lotFooter}>
                    <Text style={[styles.warehouseName, { color: colors.textSecondary }]}>
                      📍 {wh ? wh.name : 'Warehouse'}
                    </Text>
                    <Surface
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            lot.status === 'qc_pending'
                              ? colors.warningSurface
                              : lot.status === 'available'
                              ? colors.successSurface
                              : colors.surfaceVariant,
                        },
                      ]}
                      elevation={0}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              lot.status === 'qc_pending'
                                ? colors.warning
                                : lot.status === 'available'
                                ? colors.success
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {lot.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </Surface>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['2xl'] },
  headerTextContainer: { flex: 1 },
  greeting: { fontSize: FontSize.sm, fontWeight: '500' },
  name: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.xs },
  fpoBadge: { marginTop: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, alignSelf: 'flex-start' },
  fpoText: { fontSize: FontSize.xs, fontWeight: '600' },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, marginBottom: Spacing['3xl'] },
  metricCard: { flex: 1, borderRadius: BorderRadius.lg },
  metricContent: { alignItems: 'center', padding: Spacing.sm },
  metricEmoji: { fontSize: 22, marginBottom: Spacing.xs },
  metricVal: { fontSize: FontSize.md, fontWeight: '700', textAlign: 'center' },
  metricLabel: { fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, marginTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  actionBtn: { flex: 1 },
  actionBtnOutline: { flex: 1, borderWidth: 1.5 },
  emptyCard: { borderRadius: BorderRadius.lg, padding: Spacing['2xl'], alignItems: 'center' },
  emptyContent: { alignItems: 'center' },
  emptyText: { fontSize: FontSize.base, fontWeight: '500' },
  lotCard: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  lotCardContent: { padding: Spacing.lg },
  lotRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  lotCode: { fontSize: FontSize.xs, fontWeight: '500' },
  commodityName: { fontSize: FontSize.md, fontWeight: '600', marginTop: Spacing.xs },
  lotRight: { alignItems: 'flex-end' },
  lotQty: { fontSize: FontSize.md },
  lotDate: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  lotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: Spacing.md },
  warehouseName: { fontSize: FontSize.sm },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
});
