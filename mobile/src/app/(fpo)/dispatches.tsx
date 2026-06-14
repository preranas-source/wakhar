import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, Chip, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatDate } from '@/utils/formatters';
import { DispatchStatus } from '@/types';
import api from '@/utils/api';

export default function FPODispatchListScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [dispatchNotes, setDispatchNotes] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchDispatches = async () => {
        try {
          const response = await api.get('/api/dispatch-notes/');
          // Sort newest first
          const sorted = response.data.sort((a: any, b: any) => 
            new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime()
          );
          setDispatchNotes(sorted);
        } catch (err) {
          console.error('Failed to load dispatches', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDispatches();
    }, [])
  );

  const filters = [
    { key: 'all', label: 'All Shipments' },
    { key: DispatchStatus.CREATED, label: 'Created' },
    { key: DispatchStatus.IN_TRANSIT, label: 'In Transit' },
    { key: DispatchStatus.DELIVERED, label: 'Delivered' },
  ];

  const filteredDispatches = dispatchNotes.filter(dn => {
    if (selectedFilter === 'all') return true;
    return dn.status === selectedFilter;
  });

  const getStatusColorConfig = (status: string) => {
    switch (status) {
      case DispatchStatus.CREATED:
        return { bg: colors.infoSurface, text: colors.info };
      case DispatchStatus.IN_TRANSIT:
        return { bg: colors.warningSurface, text: colors.warning };
      case DispatchStatus.DELIVERED:
        return { bg: colors.primarySurface, text: colors.primary };
      case DispatchStatus.CANCELLED:
        return { bg: colors.errorSurface, text: colors.error };
      default:
        return { bg: colors.surfaceVariant, text: colors.textSecondary };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Gate Out Dispatches
        </Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          Track vehicle shipments and delivery passes
        </Text>
      </View>

      {/* Filters */}
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
          data={filteredDispatches}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🚛</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No dispatches recorded
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Dispatches matching the selected status will appear here.
              </Text>
            </View>
          }
          renderItem={({ item: dn }) => {
            const statusColors = getStatusColorConfig(dn.status);

            return (
              <Card
                style={[styles.card, { backgroundColor: colors.card }]}
                elevation={1}
                onPress={() => router.push(`/(fpo)/dispatch/${dn.id}` as any)}
              >
                <Card.Content>
                  <View style={styles.topRow}>
                    <Text style={[styles.dnCode, { color: colors.textSecondary }]}>
                      {dn.dn_code}
                    </Text>
                    <Surface style={[styles.badge, { backgroundColor: statusColors.bg }]} elevation={0}>
                      <Text style={[styles.badgeText, { color: statusColors.text }]}>
                        {dn.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </Surface>
                  </View>

                  <Text style={[styles.commodity, { color: colors.text }]}>
                    {dn.commodity_desc}
                  </Text>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailCol}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Destination</Text>
                      <Text style={[styles.val, { color: colors.text }]}>{dn.destination}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle</Text>
                      <Text style={[styles.val, { color: colors.text }]}>{dn.vehicle_reg}</Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={[styles.qty, { color: colors.primary, fontWeight: '700' }]}>
                      {dn.quantity_desc}
                    </Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                      Shipped: {formatDate(dn.dispatch_date)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
        />
      )}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        color={colors.onPrimary}
        onPress={() => router.push('/(fpo)/dispatch-create' as any)}
      />
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
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  dnCode: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  badgeText: { fontSize: 9, fontWeight: '700' },
  commodity: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  detailCol: { flex: 1 },
  label: { fontSize: 10, marginBottom: 2 },
  val: { fontSize: FontSize.sm, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: Spacing.md },
  qty: { fontSize: FontSize.sm },
  date: { fontSize: FontSize.xs },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['6xl'] },
  emptyEmoji: { fontSize: 50, marginBottom: Spacing.lg },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});
