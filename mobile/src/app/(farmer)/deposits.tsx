import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Text, Card, Surface, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatWeight, formatDate } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import { LotStatus } from '@/types';
import api from '@/utils/api';

export default function FarmerDepositsScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { farmerProfile, user } = useAuth();
  
  const farmer = farmerProfile || { id: 1 };

  const [loading, setLoading] = useState(true);
  const [allLots, setAllLots] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (!farmerProfile?.id) return;
    const fetchData = async () => {
      try {
        const [lotsRes, commRes, whRes] = await Promise.all([
          api.get(`/api/lots?farmer_id=${farmerProfile.id}`),
          api.get('/api/commodities'),
          api.get('/api/warehouses')
        ]);
        setAllLots(lotsRes.data);
        setCommodities(commRes.data);
        setWarehouses(whRes.data);
      } catch (err) {
        console.error('Failed to fetch deposits', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [farmerProfile?.id]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: LotStatus.QC_PENDING, label: 'QC Pending' },
    { key: LotStatus.AVAILABLE, label: 'Available' },
    { key: LotStatus.IN_TRANSIT, label: 'In Transit' },
    { key: LotStatus.DELIVERED, label: 'Delivered' },
    { key: LotStatus.RETURNED, label: 'Returned' },
  ];

  const filteredLots = allLots.filter(lot => {
    if (selectedFilter === 'all') return true;
    return lot.status === selectedFilter;
  });

  const getStatusColorConfig = (status: string) => {
    switch (status) {
      case LotStatus.AVAILABLE:
        return { bg: colors.successSurface, text: colors.success };
      case LotStatus.QC_PENDING:
        return { bg: colors.warningSurface, text: colors.warning };
      case LotStatus.IN_TRANSIT:
        return { bg: colors.infoSurface, text: colors.info };
      case LotStatus.DELIVERED:
        return { bg: colors.primarySurface, text: colors.primary };
      case LotStatus.RETURNED:
        return { bg: colors.errorSurface, text: colors.error };
      default:
        return { bg: colors.surfaceVariant, text: colors.textSecondary };
    }
  };

  const getCommodityById = (id: number) => commodities.find(c => c.id === id);
  const getWarehouseById = (id: number) => warehouses.find(w => w.id === id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.replace('/(farmer)' as any)} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Deposits
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const active = selectedFilter === item.key;
            return (
              <Chip
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
          }}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredLots}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No deposits found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Deposits matching the "{filters.find(f => f.key === selectedFilter)?.label}" filter will appear here.
              </Text>
            </View>
          }
          renderItem={({ item: lot }) => {
            const comm = getCommodityById(lot.commodity_id);
            const wh = getWarehouseById(lot.warehouse_id);
            const statusColors = getStatusColorConfig(lot.status);

            return (
              <Card
                style={[styles.card, { backgroundColor: colors.card }]}
                elevation={1}
                onPress={() => router.push(`/(farmer)/deposit/${lot.id}` as any)}
              >
                <Card.Content>
                  <View style={styles.topRow}>
                    <Text style={[styles.lotCode, { color: colors.textSecondary }]}>
                      {lot.lot_code}
                    </Text>
                    <Surface style={[styles.badge, { backgroundColor: statusColors.bg }]} elevation={0}>
                      <Text style={[styles.badgeText, { color: statusColors.text }]}>
                        {lot.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </Surface>
                  </View>

                  <Text style={[styles.commodity, { color: colors.text }]}>
                    {comm ? comm.name : 'Commodity'}
                  </Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={[styles.variety, { color: colors.textSecondary }]}>
                      Variety: <Text style={{ color: colors.text, fontWeight: '500' }}>{lot.variety || 'N/A'}</Text>
                    </Text>
                    <Text style={[styles.qty, { color: colors.primary }]}>
                      {formatWeight(lot.quantity_kg)}
                    </Text>
                  </View>

                  <View style={styles.footer}>
                    <Text style={[styles.warehouse, { color: colors.textSecondary }]} numberOfLines={1}>
                      📍 {wh ? wh.name : 'Warehouse'}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                      {formatDate(lot.intake_date)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', marginLeft: Spacing.xs },
  filterContainer: { paddingVertical: Spacing.md },
  filterScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  filterChip: { borderWidth: 1, height: 36, borderRadius: BorderRadius.md },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  lotCode: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  commodity: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  variety: { fontSize: FontSize.sm },
  qty: { fontSize: FontSize.md, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: Spacing.md },
  warehouse: { fontSize: FontSize.sm, flex: 1, marginRight: Spacing.md },
  date: { fontSize: FontSize.xs },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['6xl'], paddingHorizontal: Spacing['2xl'] },
  emptyEmoji: { fontSize: 50, marginBottom: Spacing.lg },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  emptySubtext: { fontSize: FontSize.sm, textAlign: 'center' },
});
