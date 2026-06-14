import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, IconButton, Button, Divider, Portal, Dialog, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { t } from '@/i18n';
import { useAuth } from '@/store/authStore';
import {
  formatWeight,
  formatCurrency,
  formatDate,
} from '@/utils/formatters';
import api from '@/utils/api';

export default function FarmerReceiptDetailScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { farmerProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [wr, setWr] = useState<any>(null);
  const [lot, setLot] = useState<any>(null);
  const [comm, setComm] = useState<any>(null);
  const [wh, setWh] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [withdrawQty, setWithdrawQty] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: wrData } = await api.get(`/api/warehouse-receipts/${id}`);
        setWr(wrData);
        if (wrData) {
          setWithdrawQty(wrData.quantity_kg.toString());
          const { data: lotData } = await api.get(`/api/lots/${wrData.lot_id}`);
          setLot(lotData);
          
          if (lotData) {
             const [commRes, whRes] = await Promise.all([
               api.get(`/api/commodities/${lotData.commodity_id}`),
               api.get(`/api/warehouses/${lotData.warehouse_id}`)
             ]);
             setComm(commRes.data);
             setWh(whRes.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!wr) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Warehouse receipt not found.
          </Text>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleWithdrawalRequest = () => {
    if (wr.collateral_status === 'disbursed' || wr.collateral_status === 'applied') {
      Alert.alert(
        'Action Blocked',
        'This receipt is pledged as collateral for an active loan. You must repay the loan to release the collateral before requesting a stock withdrawal.',
        [{ text: 'OK' }]
      );
    } else {
      setDialogVisible(true);
    }
  };

  const confirmWithdrawal = async () => {
    if (!withdrawQty || isNaN(Number(withdrawQty)) || Number(withdrawQty) <= 0 || Number(withdrawQty) > Number(wr.quantity_kg)) {
      Alert.alert('Error', 'Please enter a valid withdrawal quantity.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await api.post(`/api/warehouse-receipts/${wr.id}/withdraw`, {
        withdraw_kg: Number(withdrawQty)
      });

      // Create Activity Log in database to notify FPO
      const activityPayload = {
        type: 'system',
        message: `Stock withdrawal requested: Receipt ${wr.wr_code} by farmer ${farmerProfile?.name || 'Farmer'}`,
        reference: `Receipt ID: ${wr.id}`
      };
      await api.post('/api/activity-logs/', activityPayload);

      setDialogVisible(false);
      Alert.alert(
        'Request Submitted',
        'Your request for withdrawal has been processed. Please visit the warehouse with your Digital Gate Pass to collect your stock.',
        [{ text: 'OK', onPress: () => router.replace('/(farmer)/receipts' as any) }]
      );
    } catch (err: any) {
      console.error('Failed to process withdrawal', err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to process withdrawal request.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Receipt Details
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large Valuation Header */}
        <Surface style={[styles.valHeader, { backgroundColor: colors.primary }]} elevation={2}>
          <Text style={styles.valLabel}>Estimated Market Value</Text>
          <Text style={styles.valAmount}>{formatCurrency(wr.valuation)}</Text>
          <Text style={styles.wrCodeText}>{wr.wr_code}</Text>
        </Surface>

        {/* Commodity Info */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Commodity Details
            </Text>
            <InfoRow label="Commodity" value={comm ? comm.name : 'N/A'} />
            <InfoRow label="Variety" value={lot ? lot.variety || 'N/A' : 'N/A'} />
            <InfoRow label="Net Weight" value={formatWeight(wr.quantity_kg)} />
            <InfoRow label="Quality Grade" value={wr.grade} />
          </Card.Content>
        </Card>

        {/* Receipt Validity and Status */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Receipt Info
            </Text>
            <InfoRow label="Receipt Status" value={(wr.status || 'active').toUpperCase()} />
            <InfoRow label="Issue Date" value={formatDate(wr.issue_date)} />
            <InfoRow label="Expiry Date" value={formatDate(wr.expiry_date)} />
            <InfoRow label="Storage Location" value={wh ? wh.name : 'N/A'} />
            <Divider style={styles.divider} />
            <View style={styles.enamRow}>
              <Text style={[styles.enamLabel, { color: colors.textSecondary }]}>
                eNAM Market Status
              </Text>
              <Surface
                style={[
                  styles.enamBadge,
                  { backgroundColor: wr.enam_submitted ? colors.successSurface : colors.surfaceVariant },
                ]}
                elevation={0}
              >
                <Text style={{ color: wr.enam_submitted ? colors.success : colors.textSecondary, fontWeight: '700', fontSize: 11 }}>
                  {wr.enam_submitted ? 'SUBMITTED' : 'NOT SUBMITTED'}
                </Text>
              </Surface>
            </View>
          </Card.Content>
        </Card>

        {/* Collateral Pledging Info */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Collateral Pledging & Bank Loan
            </Text>
            <InfoRow label="Collateral Status" value={wr.collateral_status.toUpperCase()} />
            {wr.collateral_status !== 'none' && (
              <View>
                <InfoRow label="Pledge Bank Partner" value={wr.pledge_bank || 'N/A'} />
                <InfoRow label="Disbursed Loan Amount" value={formatCurrency(wr.loan_amount)} />
              </View>
            )}
            
            {wr.collateral_status === 'none' && (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                You can pledge this Warehouse Receipt as collateral with our partner banks (e.g. NABARD, SBI) to secure quick agricultural loans up to 70% of the valuation.
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Withdrawal action */}
        {(wr.status === 'active' || !wr.status) && (
          <Button
            mode="contained"
            buttonColor={colors.primary}
            style={styles.withdrawBtn}
            contentStyle={styles.withdrawBtnContent}
            onPress={handleWithdrawalRequest}
          >
            Request Stock Withdrawal
          </Button>
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={{ backgroundColor: colors.card }}>
          <Dialog.Title style={{ color: colors.text }}>Request Stock Withdrawal</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md }}>
              Enter the amount of stock you wish to withdraw from this receipt. Maximum available: {formatWeight(wr.quantity_kg)}.
            </Text>
            <TextInput
              label="Withdrawal Quantity (kg)"
              value={withdrawQty}
              onChangeText={setWithdrawQty}
              keyboardType="numeric"
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor={colors.textSecondary} disabled={isWithdrawing}>Cancel</Button>
            <Button onPress={confirmWithdrawal} textColor={colors.primary} loading={isWithdrawing} disabled={isWithdrawing}>Confirm Withdrawal</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoVal, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  valHeader: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  valLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  valAmount: {
    color: '#FFFFFF',
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  wrCodeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  card: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
  },
  infoVal: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  divider: {
    marginVertical: Spacing.md,
  },
  enamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enamLabel: {
    fontSize: FontSize.sm,
  },
  enamBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  helperText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  withdrawBtn: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  withdrawBtnContent: {
    paddingVertical: Spacing.sm,
  },
});
