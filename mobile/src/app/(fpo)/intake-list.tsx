import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Text, Card, Surface, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatWeight, formatDate, getStatusColor } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FPOIntakeListScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  
  const { fpo } = useAuth();
  const currentFpoId = fpo?.id || 1;

  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          // Fetch lots, farmers, and commodities
          const [lotsRes, farmersRes, commRes] = await Promise.all([
            api.get('/api/lots/'),
            api.get(`/api/farmers?fpo_id=${currentFpoId}`),
            api.get('/api/commodities')
          ]);
          
          const sortedLots = lotsRes.data.sort((a: any, b: any) => 
            b.id - a.id
          );
          
          setLots(sortedLots);
          setFarmers(farmersRes.data);
          setCommodities(commRes.data);
        } catch (error) {
          console.error('Failed to fetch intake list', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [currentFpoId])
  );

  const getFarmerName = (id: number) => farmers.find(f => f.id === id)?.name || 'Unknown Farmer';
  const getCommodityName = (id: number) => commodities.find(c => c.id === id)?.name || 'Commodity';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.replace('/(fpo)' as any)} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Intake Ledger
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lots}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No intakes recorded yet.
              </Text>
            </View>
          }
          renderItem={({ item: lot }) => {
            const statusColor = getStatusColor(lot.status);
            return (
              <Card
                style={[styles.card, { backgroundColor: colors.card }]}
                elevation={1}
                onPress={() => router.push(`/(fpo)/lot/${lot.id}` as any)}
              >
                <Card.Content>
                  <View style={styles.topRow}>
                    <Text style={[styles.lotCode, { color: colors.textSecondary }]}>
                      {lot.lot_code}
                    </Text>
                    <Surface style={[styles.badge, { backgroundColor: statusColor + '15' }]} elevation={0}>
                      <Text style={[styles.badgeText, { color: statusColor }]}>
                        {lot.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </Surface>
                  </View>

                  <Text style={[styles.commodity, { color: colors.text }]}>
                    {getCommodityName(lot.commodity_id)} <Text style={{ fontSize: 14, color: colors.textSecondary }}>({lot.variety || 'N/A'})</Text>
                  </Text>
                  <Text style={[styles.farmer, { color: colors.text }]}>
                    👤 {getFarmerName(lot.farmer_id)}
                  </Text>
                  
                  <View style={styles.footer}>
                    <Text style={[styles.qty, { color: colors.primary }]}>
                      {formatWeight(lot.quantity_kg)}
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
  listContent: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  lotCode: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  commodity: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
  farmer: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: Spacing.md },
  qty: { fontSize: FontSize.md, fontWeight: '700' },
  date: { fontSize: FontSize.xs },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['6xl'] },
  emptyEmoji: { fontSize: 50, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.md },
});
