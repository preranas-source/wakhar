import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import {
  formatWeight,
  formatDate,
  formatPercent,
  formatCurrency,
  getStatusColor,
  getGradeColor,
} from '@/utils/formatters';
import api from '@/utils/api';

export default function FarmerDepositDetailScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [lot, setLot] = useState<any>(null);
  const [comm, setComm] = useState<any>(null);
  const [wh, setWh] = useState<any>(null);
  const [qc, setQc] = useState<any>(null);
  const [wr, setWr] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    const fetchLotDetails = async () => {
      try {
        const { data: lotData } = await api.get(`/api/lots/${id}`);
        setLot(lotData);

        if (lotData) {
          const [commRes, whRes, qcRes, wrRes, movRes] = await Promise.all([
            api.get(`/api/commodities/${lotData.commodity_id}`),
            api.get(`/api/warehouses/${lotData.warehouse_id}`),
            api.get(`/api/quality-records/?lot_id=${lotData.id}`).catch(() => ({ data: [] })),
            api.get(`/api/warehouse-receipts/?lot_id=${lotData.id}`).catch(() => ({ data: [] })),
            api.get(`/api/stock-movements/?lot_id=${lotData.id}`).catch(() => ({ data: [] })),
          ]);

          setComm(commRes.data);
          setWh(whRes.data);
          setQc(qcRes.data?.[0] || null);
          setWr(wrRes.data?.[0] || null);
          setMovements(movRes.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch lot details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLotDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!lot) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Deposit lot not found.
          </Text>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(lot.status);
  const gradeColor = getGradeColor(lot.grade);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Deposit Details
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top summary card */}
        <Card style={[styles.summaryCard, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <View style={styles.codeRow}>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                {lot.lot_code}
              </Text>
              <Surface style={[styles.badge, { backgroundColor: statusColor + '15' }]} elevation={0}>
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {lot.status.replace('_', ' ').toUpperCase()}
                </Text>
              </Surface>
            </View>

            <Text style={[styles.commodityTitle, { color: colors.text }]}>
              {comm ? comm.name : 'Commodity'}
            </Text>
            <Text style={[styles.varietyText, { color: colors.textSecondary }]}>
              Variety: {lot.variety || 'N/A'}
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {formatWeight(lot.quantity_kg)}
                </Text>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                  Net Weight
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {lot.bag_count} bags
                </Text>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                  Quantity
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {lot.moisture_pct ? formatPercent(lot.moisture_pct) : '—'}
                </Text>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                  Moisture %
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Warehouse and Intake Info */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
              Intake Info
            </Text>
            <InfoRow label="Intake Date" value={formatDate(lot.intake_date)} />
            <InfoRow label="Warehouse" value={wh ? wh.name : 'N/A'} />
            <InfoRow label="Storage Zone" value={lot.zone || 'N/A'} />
            <InfoRow label="Intake Type" value={lot.intake_type.replace('_', ' ').toUpperCase()} />
            {lot.remarks && <InfoRow label="Remarks" value={lot.remarks} />}
          </Card.Content>
        </Card>

        {/* Quality Certificate QC */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
                Quality Certificate
              </Text>
              {qc ? (
                <Surface style={[styles.badge, { backgroundColor: gradeColor + '15' }]} elevation={0}>
                  <Text style={[styles.badgeText, { color: gradeColor }]}>
                    {qc.grade_awarded.replace('grade_', 'GRADE ').toUpperCase()}
                  </Text>
                </Surface>
              ) : (
                <Surface style={[styles.badge, { backgroundColor: colors.warningSurface }]} elevation={0}>
                  <Text style={[styles.badgeText, { color: colors.warning }]}>
                    PENDING GRADING
                  </Text>
                </Surface>
              )}
            </View>

            {qc ? (
              <View>
                <InfoRow label="Certificate Code" value={qc.qc_code} />
                <InfoRow label="Inspection Date" value={formatDate(qc.inspection_date)} />
                <Divider style={styles.subDivider} />
                
                <View style={styles.qcGrid}>
                  <QCItem label="Moisture" value={formatPercent(qc.moisture_pct)} />
                  <QCItem label="Foreign Matter" value={qc.foreign_matter_pct ? formatPercent(qc.foreign_matter_pct) : '0.0%'} />
                  <QCItem label="Broken Grain" value={qc.broken_grain_pct ? formatPercent(qc.broken_grain_pct) : '0.0%'} />
                  <QCItem label="Protein" value={qc.protein_pct ? formatPercent(qc.protein_pct) : '—'} />
                </View>
                {qc.remarks && (
                  <View style={styles.remarksBox}>
                    <Text style={[styles.remarksLabel, { color: colors.textSecondary }]}>Remarks:</Text>
                    <Text style={[styles.remarksText, { color: colors.text }]}>{qc.remarks}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                This lot is currently awaiting quality checks and grading. A warehouse receipt will be issued upon grading completion.
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Warehouse Receipt WR */}
        {wr && (
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
                  Warehouse Receipt
                </Text>
                <Surface style={[styles.badge, { backgroundColor: colors.primarySurface }]} elevation={0}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {wr.wr_code}
                  </Text>
                </Surface>
              </View>
              
              <InfoRow label="Issue Date" value={formatDate(wr.issue_date)} />
              <InfoRow label="Expiry Date" value={formatDate(wr.expiry_date)} />
              <InfoRow label="Valuation" value={formatCurrency(wr.valuation)} />
              <InfoRow label="Collateral Status" value={wr.collateral_status.toUpperCase()} />
              {wr.collateral_status !== 'none' && (
                <View>
                  <InfoRow label="Pledge Bank" value={wr.pledge_bank || '—'} />
                  <InfoRow label="Loan Amount" value={formatCurrency(wr.loan_amount)} />
                </View>
              )}
              
              <IconButton
                icon="chevron-right"
                style={styles.wrLinkBtn}
                onPress={() => router.push(`/(farmer)/receipt/${wr.id}` as any)}
              />
            </Card.Content>
          </Card>
        )}

        {/* Stock Movements Timeline */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
              Lot Timeline
            </Text>
            {movements.map((mov, index) => (
              <View key={mov.id} style={styles.timelineItem}>
                <View style={styles.timelineIndicator}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                  {index < movements.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>
                    {mov.type.toUpperCase()} — {formatWeight(mov.quantity_kg)}
                  </Text>
                  <Text style={[styles.timelineSub, { color: colors.textSecondary }]}>
                    {formatDate(mov.movement_date)}
                  </Text>
                  {mov.remarks && (
                    <Text style={[styles.timelineRemarks, { color: colors.textSecondary }]}>
                      Note: {mov.remarks}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
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

function QCItem({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  return (
    <View style={styles.qcItem}>
      <Text style={[styles.qcVal, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.qcLabel, { color: colors.textSecondary }]}>{label}</Text>
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
  summaryCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  subLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  commodityTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
  },
  varietyText: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  divider: {
    marginVertical: Spacing.lg,
  },
  specGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specVal: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  specLabel: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardSectionTitle: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subDivider: {
    marginVertical: Spacing.md,
  },
  qcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  qcItem: {
    width: '46%',
    padding: Spacing.md,
    backgroundColor: '#F9FAF7',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  qcVal: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  qcLabel: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  remarksBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.md,
  },
  remarksLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  remarksText: {
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  wrLinkBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineIndicator: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: Spacing.xs,
  },
  timelineLine: {
    width: 2,
    flex: 1,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  timelineTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  timelineSub: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  timelineRemarks: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
});
