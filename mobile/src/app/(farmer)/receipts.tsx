import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Text, Card, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import {
  formatWeight,
  formatCurrency,
  formatDate,
} from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import { WRStatus } from '@/types';
import api from '@/utils/api';

export default function FarmerReceiptsScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { farmerProfile } = useAuth();
  
  const farmer = farmerProfile || { id: 1 };

  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);

  useEffect(() => {
    if (!farmerProfile?.id) return;
    const fetchData = async () => {
      try {
        const [receiptsRes, lotsRes, commRes] = await Promise.all([
          api.get(`/api/warehouse-receipts?farmer_id=${farmerProfile.id}`), 
          api.get(`/api/lots?farmer_id=${farmerProfile.id}`),
          api.get('/api/commodities')
        ]);
        setReceipts(receiptsRes.data);
        setLots(lotsRes.data);
        setCommodities(commRes.data);
      } catch (err) {
        console.error('Failed to fetch receipts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [farmerProfile?.id]);

  const getStatusColorConfig = (status: string) => {
    switch (status) {
      case WRStatus.ACTIVE:
        return { bg: colors.successSurface, text: colors.success };
      case WRStatus.AMENDED:
        return { bg: colors.infoSurface, text: colors.info };
      case WRStatus.WITHDRAWN:
        return { bg: colors.surfaceVariant, text: colors.textSecondary };
      case WRStatus.EXPIRED:
        return { bg: colors.errorSurface, text: colors.error };
      default:
        return { bg: colors.surfaceVariant, text: colors.textSecondary };
    }
  };

  const getCommodityById = (id: number) => commodities.find(c => c.id === id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.replace('/(farmer)' as any)} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Warehouse Receipts
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No receipts issued yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Your warehouse receipts will be visible here once your deposits are graded and approved.
              </Text>
            </View>
          }
          renderItem={({ item: wr }) => {
            const lot = lots.find(l => l.id === wr.lot_id);
            const comm = lot ? getCommodityById(lot.commodity_id) : null;
            const statusColors = getStatusColorConfig(wr.status);

            return (
              <Card
                style={[styles.card, { backgroundColor: colors.card }]}
                elevation={1}
                onPress={() => router.push(`/(farmer)/receipt/${wr.id}` as any)}
              >
                <Card.Content>
                  <View style={styles.topRow}>
                    <Text style={[styles.wrCode, { color: colors.textSecondary }]}>
                      {wr.wr_code}
                    </Text>
                    <Surface style={[styles.badge, { backgroundColor: statusColors.bg }]} elevation={0}>
                      <Text style={[styles.badgeText, { color: statusColors.text }]}>
                        {wr.status.toUpperCase()}
                      </Text>
                    </Surface>
                  </View>

                  <View style={styles.middleRow}>
                    <View style={styles.infoCol}>
                      <Text style={[styles.commodity, { color: colors.text }]}>
                        {comm ? comm.name : 'Commodity'}
                      </Text>
                      <Text style={[styles.qty, { color: colors.textSecondary }]}>
                        Qty: <Text style={{ color: colors.text, fontWeight: '600' }}>{formatWeight(wr.quantity_kg)}</Text>
                      </Text>
                    </View>
                    <View style={styles.valuationCol}>
                      <Text style={[styles.valLabel, { color: colors.textSecondary }]}>
                        Valuation
                      </Text>
                      <Text style={[styles.valAmount, { color: colors.primary }]}>
                        {formatCurrency(wr.valuation)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <View style={styles.collateralBadgeContainer}>
                      <Surface
                        style={[
                          styles.collateralBadge,
                          {
                            backgroundColor:
                              wr.collateral_status === 'none'
                                ? colors.surfaceVariant
                                : colors.secondarySurface,
                          },
                        ]}
                        elevation={0}
                      >
                        <Text
                          style={[
                            styles.collateralText,
                            {
                              color:
                                wr.collateral_status === 'none'
                                  ? colors.textSecondary
                                  : colors.secondary,
                            },
                          ]}
                        >
                          🔗 PLEDGE: {wr.collateral_status.toUpperCase()}
                        </Text>
                      </Surface>
                    </View>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                      Expires: {formatDate(wr.expiry_date)}
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
  listContent: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  wrCode: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  middleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  infoCol: { flex: 1 },
  commodity: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  qty: { fontSize: FontSize.sm },
  valuationCol: { alignItems: 'flex-end' },
  valLabel: { fontSize: FontSize.xs, marginBottom: Spacing.xs },
  valAmount: { fontSize: FontSize.lg, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: Spacing.md },
  collateralBadgeContainer: { flex: 1.2, marginRight: Spacing.md },
  collateralBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, alignSelf: 'flex-start' },
  collateralText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  date: { fontSize: FontSize.xs, flex: 1, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['6xl'], paddingHorizontal: Spacing['2xl'] },
  emptyEmoji: { fontSize: 50, marginBottom: Spacing.lg },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  emptySubtext: { fontSize: FontSize.sm, textAlign: 'center' },
});
