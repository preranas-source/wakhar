import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Divider, Button, Badge, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatDate } from '@/utils/formatters';
import api from '@/utils/api';

export default function FPOWithdrawalRequestsScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchWithdrawals = async () => {
    try {
      // Fetch all activity logs of type system
      const { data: logs } = await api.get('/api/activity-logs?type=system');
      
      // Filter logs that represent withdrawal requests
      const withdrawalLogs = logs.filter((log: any) => 
        log.message && log.message.toLowerCase().includes('withdrawal requested')
      );

      // For each log, fetch the corresponding warehouse receipt to get the current status
      const resolvedRequests = await Promise.all(
        withdrawalLogs.map(async (log: any) => {
          let receiptId = null;
          if (log.reference && log.reference.includes('Receipt ID:')) {
            receiptId = Number(log.reference.replace('Receipt ID:', '').trim());
          }

          if (receiptId) {
            try {
              const { data: wr } = await api.get(`/api/warehouse-receipts/${receiptId}`);
              return { ...log, receipt: wr, receiptId };
            } catch (e) {
              console.error(`Failed to fetch receipt ${receiptId}`, e);
            }
          }
          return { ...log, receipt: null, receiptId: null };
        })
      );

      setRequests(resolvedRequests.filter(r => r.receipt !== null));
    } catch (error) {
      console.error('Failed to fetch withdrawal requests', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWithdrawals();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWithdrawals();
    setRefreshing(false);
  }, []);

  const handleApprove = (req: any) => {
    Alert.alert(
      'Approve Withdrawal',
      `Approve stock release for Receipt ${req.receipt.wr_code}? This will release the stock and mark the receipt as WITHDRAWN.`,
      [
        { text: 'Cancel' },
        {
          text: 'Approve & Release',
          onPress: async () => {
            try {
              // 1. Update Receipt Status to 'withdrawn'
              const updatedReceipt = { ...req.receipt, status: 'withdrawn' };
              await api.put(`/api/warehouse-receipts/${req.receiptId}`, updatedReceipt);

              // 2. Fetch the Lot and update status to 'returned' (withdrawn back to farmer)
              const { data: lot } = await api.get(`/api/lots/${req.receipt.lot_id}`);
              await api.put(`/api/lots/${req.receipt.lot_id}`, {
                ...lot,
                status: 'returned'
              });

              // 3. Post a new activity log
              await api.post('/api/activity-logs/', {
                type: 'system',
                message: `Stock withdrawal APPROVED: Receipt ${req.receipt.wr_code} released to farmer.`,
                reference: `Receipt ID: ${req.receiptId}`
              });

              Alert.alert('Approved', 'Stock withdrawal request has been approved and registered.');
              fetchWithdrawals();
            } catch (err) {
              console.error('Failed to approve withdrawal', err);
              Alert.alert('Error', 'Failed to approve withdrawal.');
            }
          }
        }
      ]
    );
  };

  const handleReject = (req: any) => {
    Alert.alert(
      'Reject Withdrawal',
      `Reject stock release for Receipt ${req.receipt.wr_code}?`,
      [
        { text: 'Cancel' },
        {
          text: 'Reject Request',
          onPress: async () => {
            try {
              // Post rejection activity log
              await api.post('/api/activity-logs/', {
                type: 'system',
                message: `Stock withdrawal REJECTED: Receipt ${req.receipt.wr_code} request denied.`,
                reference: `Receipt ID: ${req.receiptId}`
              });

              Alert.alert('Rejected', 'Withdrawal request rejected.');
              fetchWithdrawals();
            } catch (err) {
              console.error('Failed to reject withdrawal', err);
              Alert.alert('Error', 'Failed to reject request.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Withdrawal Requests
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌾</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No requests found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Pending farmer stock withdrawal requests will appear here.
              </Text>
            </View>
          ) : (
            requests.map((req) => {
              const isWithdrawn = req.receipt.status === 'withdrawn';
              const statusText = isWithdrawn ? 'APPROVED' : 'PENDING';
              const statusColor = isWithdrawn ? colors.success : colors.warning;

              return (
                <Card key={req.id} style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
                  <Card.Content>
                    <View style={styles.topRow}>
                      <Text style={[styles.wrCode, { color: colors.textSecondary }]}>
                        {req.receipt.wr_code}
                      </Text>
                      <Badge
                        style={[
                          styles.badge,
                          {
                            backgroundColor: isWithdrawn ? colors.successSurface : colors.warningSurface,
                            color: statusColor,
                          }
                        ]}
                      >
                        {statusText}
                      </Badge>
                    </View>

                    <Text style={[styles.message, { color: colors.text }]}>
                      {req.message}
                    </Text>

                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                      Requested: {formatDate(req.created_at)}
                    </Text>

                    <Divider style={styles.divider} />

                    <View style={styles.detailsGrid}>
                      <View style={styles.gridCol}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Stored Quantity</Text>
                        <Text style={[styles.val, { color: colors.text }]}>{req.receipt.quantity_kg} kg</Text>
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Valuation</Text>
                        <Text style={[styles.val, { color: colors.text }]}>₹{req.receipt.valuation.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    {!isWithdrawn && (
                      <View style={styles.actions}>
                        <Button
                          mode="outlined"
                          style={[styles.actionBtn, { borderColor: colors.error }]}
                          textColor={colors.error}
                          onPress={() => handleReject(req)}
                        >
                          Reject
                        </Button>
                        <Button
                          mode="contained"
                          style={styles.actionBtn}
                          buttonColor={colors.primary}
                          onPress={() => handleApprove(req)}
                        >
                          Approve
                        </Button>
                      </View>
                    )}
                  </Card.Content>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['6xl'] },
  emptyEmoji: { fontSize: 50, marginBottom: Spacing.lg },
  emptyText: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.xs },
  emptySub: { fontSize: FontSize.sm, textAlign: 'center' },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  wrCode: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, fontSize: 9, fontWeight: '700' },
  message: { fontSize: FontSize.sm, fontWeight: '600', marginVertical: Spacing.xs },
  date: { fontSize: 11, marginTop: Spacing.xs },
  divider: { marginVertical: Spacing.md },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  gridCol: { flex: 1 },
  label: { fontSize: 10, marginBottom: 2 },
  val: { fontSize: FontSize.sm, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.md },
  actionBtn: { borderRadius: BorderRadius.md, minWidth: 100 },
});
