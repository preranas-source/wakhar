import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, ProgressBar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FPOWarehousesScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();

  const currentFpoId = fpo?.id || 1;
  const [loading, setLoading] = useState(true);
  const [fpoWarehouses, setFpoWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await api.get(`/api/warehouses?fpo_id=${currentFpoId}`);
        setFpoWarehouses(response.data);
      } catch (err) {
        console.error('Failed to load warehouses', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, [currentFpoId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Warehouse Overview
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={fpoWarehouses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏢</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No warehouses registered</Text>
            </View>
          }
          renderItem={({ item: wh }) => {
            const utilization = wh.capacity_mt > 0 ? (wh.current_stock_mt || 0) / wh.capacity_mt : 0;
            const utilizationPercent = Math.min(Math.round(utilization * 100), 100);

            let barColor: string = colors.primary;
            if (utilization >= 0.9) barColor = colors.error;
            else if (utilization >= 0.7) barColor = colors.warning;

            return (
              <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
                <Card.Content>
                  {/* Code and status row */}
                  <View style={styles.topRow}>
                    <Text style={[styles.whCode, { color: colors.textSecondary }]}>
                      {wh.code || `WH-${wh.id}`}
                    </Text>
                    <Surface
                      style={[
                        styles.badge,
                        { backgroundColor: wh.is_active ? colors.successSurface : colors.errorSurface },
                      ]}
                      elevation={0}
                    >
                      <Text style={[styles.badgeText, { color: wh.is_active ? colors.success : colors.error }]}>
                        {wh.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </Surface>
                  </View>

                  {/* Name */}
                  <Text style={[styles.whName, { color: colors.text }]}>
                    {wh.name}
                  </Text>

                  {/* Utilization meter */}
                  <View style={styles.utilizationRow}>
                    <View style={styles.utilizationLabelRow}>
                      <Text style={[styles.utilLabel, { color: colors.textSecondary }]}>
                        Space Utilization
                      </Text>
                      <Text style={[styles.utilVal, { color: colors.text }]}>
                        {(wh.current_stock_mt || 0).toFixed(1)} / {wh.capacity_mt} MT ({utilizationPercent}%)
                      </Text>
                    </View>
                    <ProgressBar progress={utilization} color={barColor} style={styles.progressBar} />
                  </View>

                  {/* Details */}
                  <View style={styles.detailsBox}>
                    <InfoRow label="Manager" value={wh.contact_person || 'N/A'} />
                    <InfoRow label="Phone" value={wh.contact_phone || 'N/A'} />
                    <InfoRow label="Hours" value={wh.operating_hours || 'N/A'} />
                    <InfoRow label="Permitted" value={wh.permitted_commodities || 'All'} />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
      <Text style={[styles.infoVal, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', marginLeft: Spacing.xs },
  listContent: { padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  whCode: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  badgeText: { fontSize: 9, fontWeight: '700' },
  whName: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  utilizationRow: { marginBottom: Spacing.md },
  utilizationLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  utilLabel: { fontSize: FontSize.xs },
  utilVal: { fontSize: FontSize.xs, fontWeight: '600' },
  progressBar: { height: 8, borderRadius: BorderRadius.sm },
  detailsBox: { marginTop: Spacing.sm, padding: Spacing.md, backgroundColor: '#F9FAF7', borderRadius: BorderRadius.md },
  infoRow: { flexDirection: 'row', paddingVertical: 2 },
  infoLabel: { fontSize: 11, width: 65 },
  infoVal: { fontSize: 11, fontWeight: '600', flex: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['5xl'] },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.md, fontWeight: '600' },
});
