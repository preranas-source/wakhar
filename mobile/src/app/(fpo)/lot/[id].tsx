import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text, Card, Surface, IconButton, Divider, Button } from 'react-native-paper';
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
import { useTranslation } from '@/i18n';
import { LotStatus } from '@/types';
import api from '@/utils/api';
import WarehouseLayoutSelector from '@/components/WarehouseLayoutSelector';

export default function FPOLotDetailScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  
  const [lot, setLot] = useState<any>(null);
  const [farmer, setFarmer] = useState<any>(null);
  const [comm, setComm] = useState<any>(null);
  const [wh, setWh] = useState<any>(null);
  const [qc, setQc] = useState<any>(null);
  const [wr, setWr] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [isGeneratingWR, setIsGeneratingWR] = useState(false);
  const [layoutSelectorVisible, setLayoutSelectorVisible] = useState(false);

  const handleUpdateLayout = async (zoneStr: string) => {
    try {
      await api.put(`/api/lots/${id}`, { ...lot, zone: zoneStr });
      setLot({ ...lot, zone: zoneStr });
      setLayoutSelectorVisible(false);
    } catch (err) {
      console.error('Failed to update zone', err);
      Alert.alert(t('common.error') || 'Error', 'Could not update storage location.');
    }
  };

  const handleGenerateWR = async () => {
    setIsGeneratingWR(true);
    try {
      const today = new Date();
      const expiry = new Date();
      expiry.setMonth(today.getMonth() + 3);

      const wrCode = `WR-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        wr_code: wrCode,
        lot_id: lot.id,
        farmer_id: lot.farmer_id,
        issue_date: today.toISOString().split('T')[0],
        expiry_date: expiry.toISOString().split('T')[0],
        quantity_kg: Number(lot.quantity_kg),
        grade: qc?.grade_awarded ? qc.grade_awarded.replace('grade_', 'Grade ').toUpperCase() : 'Grade A',
        valuation: 0.0,
        collateral_status: 'none',
        loan_amount: 0.0,
        status: 'active',
        enam_submitted: false
      };

      const res = await api.post('/api/warehouse-receipts/', payload);
      setWr(res.data);
      Alert.alert(
        'Warehouse Receipt Generated',
        `e-WR Reference: ${res.data.wr_code}\nValuation: ₹${res.data.valuation.toLocaleString('en-IN')}\n\nThis is now visible in the farmer's portal.`
      );
    } catch (err) {
      console.error('Failed to generate warehouse receipt', err);
      Alert.alert(t('common.error') || 'Error', 'Could not generate Warehouse Receipt.');
    } finally {
      setIsGeneratingWR(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLot(null);
      setFarmer(null);
      setComm(null);
      setWh(null);
      setQc(null);
      setWr(null);
      setMovements([]);
      try {
        // Fetch primary lot
        const lotRes = await api.get(`/api/lots/${id}`);
        const lotData = lotRes.data;
        setLot(lotData);

        // Fetch parallel relationships
        const [farmRes, commRes, whRes, qcRes, wrRes, movRes] = await Promise.all([
          api.get(`/api/farmers/${lotData.farmer_id}`),
          api.get(`/api/commodities/${lotData.commodity_id}`),
          api.get(`/api/warehouses/${lotData.warehouse_id}`),
          api.get(`/api/quality-records/?lot_id=${id}`),
          api.get(`/api/warehouse-receipts/?lot_id=${id}`),
          api.get(`/api/stock-movements/?lot_id=${id}`)
        ]);

        setFarmer(farmRes.data);
        setComm(commRes.data);
        setWh(whRes.data);
        setQc(qcRes.data.length > 0 ? qcRes.data[0] : null);
        setWr(wrRes.data.length > 0 ? wrRes.data[0] : null);

        setMovements(movRes.data.sort((a: any, b: any) => 
          new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime()
        ));
      } catch (err) {
        console.error('Failed to load lot details', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
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
            {t('errors.lotNotFound')}
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
          {t('fpo.lotDetail')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Summary Card */}
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
              {comm ? comm.name : t('lot.commodity')} {lot.variety && `(${lot.variety})`}
            </Text>
            <Text style={[styles.farmerText, { color: colors.textSecondary }]}>
              {t('lot.farmer')}: {farmer ? farmer.name : 'Unknown'} ({farmer?.farmer_code})
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {formatWeight(lot.quantity_kg)}
                </Text>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                  {t('lot.quantity')}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {lot.bag_count} {t('lot.bags')}
                </Text>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                  {t('fpo.bagCount')}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {lot.moisture_pct ? formatPercent(lot.moisture_pct) : '—'}
                </Text>
                <Text style={[styles.specLabel, { color: colors.textSecondary }]}>
                  {t('lot.moisture')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Storage location */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.cardSectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Storage Location
              </Text>
              <Button mode="text" onPress={() => setLayoutSelectorVisible(true)} textColor={colors.primary} compact>
                Edit Layout
              </Button>
            </View>
            <InfoRow label={t('lot.warehouse')} value={wh ? wh.name : 'N/A'} />
            <InfoRow label={t('lot.zone')} value={lot.zone || 'Unassigned'} />
            <InfoRow label={t('fpo.intakeType')} value={lot.intake_type.replace('_', ' ').toUpperCase()} />
            <InfoRow label={t('lot.intakeDate')} value={formatDate(lot.intake_date)} />
          </Card.Content>
        </Card>

        {/* Quality Certificate */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
                {t('lot.qualityRecords')}
              </Text>
              {qc ? (
                <Surface style={[styles.badge, { backgroundColor: gradeColor + '15' }]} elevation={0}>
                  <Text style={[styles.badgeText, { color: gradeColor }]}>
                    {qc.grade_awarded.replace('grade_', 'Grade ').toUpperCase()}
                  </Text>
                </Surface>
              ) : (
                <Surface style={[styles.badge, { backgroundColor: colors.warningSurface }]} elevation={0}>
                  <Text style={[styles.badgeText, { color: colors.warning }]}>
                    QC PENDING
                  </Text>
                </Surface>
              )}
            </View>

            {qc ? (
              <View>
                <InfoRow label="Inspection Code" value={qc.qc_code} />
                <InfoRow label="Inspection Date" value={formatDate(qc.inspection_date)} />
                <Divider style={styles.subDivider} />
                <View style={styles.qcGrid}>
                  <QCItem label={t('lot.moisture')} value={qc.moisture_pct ? formatPercent(qc.moisture_pct) : '—'} />
                  <QCItem label={t('fpo.foreignMatterPct')} value={qc.foreign_matter_pct ? formatPercent(qc.foreign_matter_pct) : '0.0%'} />
                  <QCItem label={t('fpo.brokenGrainPct')} value={qc.broken_grain_pct ? formatPercent(qc.broken_grain_pct) : '0.0%'} />
                  <QCItem label={t('fpo.proteinPct')} value={qc.protein_pct ? formatPercent(qc.protein_pct) : '—'} />
                </View>
              </View>
            ) : (
              <View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Quality inspection has not been completed.
                </Text>
                {lot.status === LotStatus.QC_PENDING && (
                  <Button
                    mode="contained"
                    buttonColor={colors.primary}
                    style={styles.actionBtnInline}
                    onPress={() => router.push({ pathname: '/(fpo)/grading', params: { lotId: lot.id } } as any)}
                  >
                    {t('fpo.gradeLot')}
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Warehouse Receipt */}
        {wr ? (
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
                  {t('lot.warehouseReceipt')}
                </Text>
                <Surface style={[styles.badge, { backgroundColor: colors.successSurface }]} elevation={0}>
                  <Text style={[styles.badgeText, { color: colors.success }]}>
                    {wr.wr_code}
                  </Text>
                </Surface>
              </View>
              <InfoRow label="Receipt Value" value={formatCurrency(wr.valuation)} />
              <InfoRow label="eNAM Submitted" value={wr.enam_submitted ? 'Yes' : 'No'} />
              <InfoRow label="Pledge Status" value={wr.collateral_status.toUpperCase()} />
              {wr.collateral_status !== 'none' && (
                <InfoRow label="Loan Financed" value={formatCurrency(wr.loan_amount)} />
              )}
            </Card.Content>
          </Card>
        ) : (
          qc && qc.grade_awarded !== 'rejected' && lot.status === LotStatus.AVAILABLE && (
            <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
              <Card.Content>
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
                  {t('lot.warehouseReceipt')}
                </Text>
                <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
                  Grading completed successfully. A warehouse receipt can now be generated for the farmer.
                </Text>
                <Button
                  mode="outlined"
                  textColor={colors.primary}
                  style={{ borderColor: colors.primary, borderWidth: 1.5 }}
                  onPress={handleGenerateWR}
                  loading={isGeneratingWR}
                  disabled={isGeneratingWR}
                >
                  {t('fpo.issueWR')}
                </Button>
              </Card.Content>
            </Card>
          )
        )}

        {/* Movements */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
              {t('lot.stockMovements')}
            </Text>
            {movements.length === 0 && (
              <Text style={{ color: colors.textSecondary }}>{t('common.noData')}</Text>
            )}
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

        {/* Primary Dispatch Action */}
        {lot.status === LotStatus.AVAILABLE && (
          <Button
            mode="contained"
            buttonColor={colors.secondary}
            onPress={() => router.push({ pathname: '/(fpo)/dispatch-create', params: { lotId: lot.id } } as any)}
            style={styles.dispatchBtn}
            contentStyle={{ paddingVertical: Spacing.sm }}
          >
            {t('fpo.createDispatch')}
          </Button>
        )}
      </ScrollView>

      <WarehouseLayoutSelector
        visible={layoutSelectorVisible}
        onDismiss={() => setLayoutSelectorVisible(false)}
        onSelect={handleUpdateLayout}
        currentZone={lot.zone || ''}
      />
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md },
  summaryCard: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  subLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  badgeText: { fontSize: 9, fontWeight: '700' },
  commodityTitle: { fontSize: FontSize['2xl'], fontWeight: '700' },
  farmerText: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  divider: { marginVertical: Spacing.lg },
  specGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  specItem: { alignItems: 'center', flex: 1 },
  specVal: { fontSize: FontSize.lg, fontWeight: '700' },
  specLabel: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  cardSectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm },
  infoVal: { fontSize: FontSize.sm, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  subDivider: { marginVertical: Spacing.md },
  qcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  qcItem: { width: '46%', padding: Spacing.md, backgroundColor: '#F9FAF7', borderRadius: BorderRadius.md, alignItems: 'center' },
  qcVal: { fontSize: FontSize.md, fontWeight: '700' },
  qcLabel: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  helperText: { fontSize: FontSize.xs, lineHeight: 18, marginBottom: Spacing.md },
  actionBtnInline: { borderRadius: BorderRadius.md },
  timelineItem: { flexDirection: 'row', minHeight: 60 },
  timelineIndicator: { width: 24, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: Spacing.xs },
  timelineLine: { width: 2, flex: 1 },
  timelineContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.lg },
  timelineTitle: { fontSize: FontSize.sm, fontWeight: '700' },
  timelineSub: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  timelineRemarks: { fontSize: FontSize.xs, fontStyle: 'italic', marginTop: Spacing.xs },
  dispatchBtn: { marginTop: Spacing.md, borderRadius: BorderRadius.lg },
});
