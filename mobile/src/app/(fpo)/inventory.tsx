import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useTranslation } from '@/i18n';
import {
  formatWeight,
  getStatusColor,
  getGradeColor,
} from '@/utils/formatters';
import { LotStatus } from '@/types';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FPOInventoryScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();
  const { t } = useTranslation();
  const { filter } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedCommodityId, setExpandedCommodityId] = useState<number | null>(null);

  const [commodities, setCommodities] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (filter) {
        setSelectedFilter(filter as string);
      }
      const fetchData = async () => {
        if (!fpo?.id) return;
        try {
          const [commRes, lotsRes, whRes] = await Promise.all([
            api.get('/api/commodities'),
            api.get('/api/lots/'),
            api.get(`/api/warehouses?fpo_id=${fpo.id}`)
          ]);
          setCommodities(commRes.data);
          setLots(lotsRes.data);
          setWarehouses(whRes.data);
        } catch (err) {
          console.error('Failed to fetch inventory', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [fpo?.id, filter])
  );

  const filters = [
    { key: 'all', label: t('common.all') },
    { key: LotStatus.AVAILABLE, label: t('statuses.available') },
    { key: LotStatus.RESERVED, label: t('statuses.reserved') },
    { key: LotStatus.QC_PENDING, label: t('statuses.qc_pending') },
  ];

  // Group lots by commodity
  const ledgerData = commodities.map(comm => {
    // Get lots matching commodity and filter
    const matchingLots = lots.filter(lot => {
      if (lot.commodity_id !== comm.id) return false;
      if (selectedFilter === 'all') {
        return !['in_transit', 'delivered', 'withdrawn'].includes(lot.status);
      }
      return lot.status === selectedFilter;
    });

    const totalWeight = matchingLots.reduce((sum, l) => sum + Number(l.quantity_kg), 0);

    return {
      commodity: comm,
      lots: matchingLots,
      totalWeight,
      count: matchingLots.length,
    };
  }).filter(item => item.count > 0); // Hide commodities with 0 lots under current filter

  const toggleExpand = (commId: number) => {
    if (expandedCommodityId === commId) {
      setExpandedCommodityId(null);
    } else {
      setExpandedCommodityId(commId);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('fpo.stockLedger')}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Current warehouse inventory overview
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(fpo)/audit' as any)} style={{ backgroundColor: colors.primary + '15', padding: Spacing.sm, borderRadius: BorderRadius.sm }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Physical Audit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(item => {
            const active = selectedFilter === item.key;
            return (
              <Chip
                key={item.key}
                selected={active}
                onPress={() => setSelectedFilter(item.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                textStyle={{
                  color: active ? colors.onPrimary : colors.text,
                  fontWeight: '600',
                  fontSize: 13,
                }}
                showSelectedOverlay={false}
              >
                {item.label}
              </Chip>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Capacity Warnings */}
          {warehouses.length > 0 && (
            <View style={{ marginBottom: Spacing.xl }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text, marginBottom: Spacing.sm }}>
                {t('fpo.capacity')}
              </Text>
              {warehouses.map(wh => {
                const capacity = Number(wh.capacity_mt) || 1;
                const stock = Number(wh.current_stock_mt) || 0;
                const progress = stock / capacity;
                const isWarning = progress > 0.85;
                const isCritical = progress > 0.95;
                const barColor = isCritical ? colors.error : (isWarning ? colors.warning : colors.primary);

                return (
                  <Card key={wh.id} style={[{ backgroundColor: colors.card, marginBottom: Spacing.sm }]} elevation={0}>
                    <Card.Content style={{ paddingVertical: Spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                        <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{wh.name}</Text>
                        <Text style={{ fontSize: FontSize.xs, color: isCritical ? colors.error : colors.textSecondary, fontWeight: isCritical ? '700' : 'normal' }}>
                          {stock.toFixed(1)} / {capacity.toFixed(1)} MT
                        </Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.min(progress * 100, 100)}%`, height: '100%', backgroundColor: barColor }} />
                      </View>
                      {isWarning && (
                        <Text style={{ fontSize: 10, color: barColor, marginTop: 4 }}>
                          {isCritical ? 'Critical: Warehouse is almost full!' : 'Warning: Approaching maximum capacity.'}
                        </Text>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}

          {ledgerData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>{t('common.noData')}</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                There are no lots currently matching the selected status.
              </Text>
            </View>
          ) : (
            ledgerData.map(({ commodity, lots: commLots, totalWeight, count }) => {
              const isExpanded = expandedCommodityId === commodity.id;
              return (
                <Card key={commodity.id} style={[styles.commCard, { backgroundColor: colors.card }]} elevation={1}>
                  <TouchableOpacity onPress={() => toggleExpand(commodity.id)} activeOpacity={0.7}>
                    <Card.Content style={styles.commCardHeader}>
                      <View style={styles.leftCol}>
                        <Text style={[styles.commName, { color: colors.text }]}>
                          {commodity.name}
                        </Text>
                        {commodity.name_mr && (
                          <Text style={[styles.commLocalName, { color: colors.textSecondary }]}>
                            {commodity.name_mr} / {commodity.name_hi}
                          </Text>
                        )}
                      </View>
                      <View style={styles.rightCol}>
                        <Text style={[styles.commWeight, { color: colors.primary }]}>
                          {formatWeight(totalWeight, 'mt')}
                        </Text>
                        <Text style={[styles.lotCount, { color: colors.textSecondary }]}>
                          {count} {count === 1 ? 'lot' : 'lots'}
                        </Text>
                      </View>
                    </Card.Content>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expansionContainer}>
                      <Divider />
                      {commLots.map((lot, idx) => {
                        const wh = warehouses.find(w => w.id === lot.warehouse_id);
                        const statusColor = getStatusColor(lot.status);
                        const gradeColor = getGradeColor(lot.grade);

                        return (
                          <TouchableOpacity
                            key={lot.id}
                            style={[
                              styles.lotItem,
                              { borderBottomWidth: idx < commLots.length - 1 ? 1 : 0, borderBottomColor: '#F5F5F5' },
                            ]}
                            onPress={() => router.push(`/(fpo)/lot/${lot.id}` as any)}
                          >
                            <View style={styles.lotHeader}>
                              <Text style={[styles.lotCode, { color: colors.text }]}>
                                {lot.lot_code}
                              </Text>
                              <View style={styles.badges}>
                                {lot.grade !== 'pending' && (
                                  <Surface style={[styles.lotBadge, { backgroundColor: gradeColor + '15' }]} elevation={0}>
                                    <Text style={[styles.lotBadgeText, { color: gradeColor }]}>
                                      {lot.grade.replace('grade_', 'Grade ').toUpperCase()}
                                    </Text>
                                  </Surface>
                                )}
                                <Surface style={[styles.lotBadge, { backgroundColor: statusColor + '15' }]} elevation={0}>
                                  <Text style={[styles.lotBadgeText, { color: statusColor }]}>
                                    {lot.status.replace('_', ' ').toUpperCase()}
                                  </Text>
                                </Surface>
                              </View>
                            </View>
                            
                            <View style={styles.lotFooter}>
                              <Text style={[styles.lotWeight, { color: colors.text }]}>
                                {t('lot.quantity')}: {formatWeight(lot.quantity_kg)}
                              </Text>
                              <Text style={[styles.lotLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                                📍 {wh ? wh.name : t('lot.warehouse')}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  headerSub: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  filterContainer: { paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  filterChip: { borderWidth: 1, height: 36, borderRadius: BorderRadius.md },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  commCard: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  commCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.lg },
  leftCol: { flex: 1 },
  commName: { fontSize: FontSize.lg, fontWeight: '700' },
  commLocalName: { fontSize: FontSize.xs, marginTop: 2 },
  rightCol: { alignItems: 'flex-end' },
  commWeight: { fontSize: FontSize.lg, fontWeight: '700' },
  lotCount: { fontSize: FontSize.xs, marginTop: 2 },
  expansionContainer: { backgroundColor: '#FAFAF8' },
  lotItem: { padding: Spacing.lg },
  lotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  lotCode: { fontSize: FontSize.sm, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: Spacing.xs },
  lotBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  lotBadgeText: { fontSize: 8, fontWeight: '700' },
  lotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lotWeight: { fontSize: FontSize.sm, fontWeight: '600' },
  lotLocation: { fontSize: FontSize.xs, flex: 0.8, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['6xl'] },
  emptyEmoji: { fontSize: 50, marginBottom: Spacing.lg },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center' },
});
