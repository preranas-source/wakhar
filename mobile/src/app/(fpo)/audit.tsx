import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Divider, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatWeight, formatDate } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FPOAuditScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();
  
  const currentFpoId = fpo?.id || 1;

  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  
  const [selectedWhId, setSelectedWhId] = useState<number | null>(null);
  const [actualStock, setActualStock] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAudits = async () => {
    try {
      const whRes = await api.get(`/api/warehouses?fpo_id=${currentFpoId}`);
      setWarehouses(whRes.data);
      if (whRes.data.length > 0 && !selectedWhId) {
        setSelectedWhId(whRes.data[0].id);
      }

      const auditRes = await api.get(`/api/audits`);
      setAudits(auditRes.data);
    } catch (err) {
      console.error('Failed to fetch audits', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAudits();
    }, [currentFpoId])
  );

  const handleSubmitAudit = async () => {
    if (!selectedWhId) {
      Alert.alert('Error', 'Please select a warehouse');
      return;
    }
    if (!actualStock || isNaN(Number(actualStock)) || Number(actualStock) < 0) {
      Alert.alert('Error', 'Please enter a valid actual stock value');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/audits/', {
        warehouse_id: selectedWhId,
        actual_stock_mt: Number(actualStock),
        remarks: remarks
      });
      Alert.alert('Success', 'Physical cycle count recorded successfully.');
      setActualStock('');
      setRemarks('');
      fetchAudits();
    } catch (err) {
      console.error('Failed to submit audit', err);
      Alert.alert('Error', 'Failed to record audit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const selectedWh = warehouses.find(w => w.id === selectedWhId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Physical Cycle Count</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Audit Form */}
          <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>New Stock Audit</Text>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>Select Warehouse</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                {warehouses.map(wh => (
                  <Button
                    key={wh.id}
                    mode={selectedWhId === wh.id ? "contained" : "outlined"}
                    onPress={() => setSelectedWhId(wh.id)}
                    style={{ marginRight: Spacing.sm }}
                    buttonColor={selectedWhId === wh.id ? colors.primary : undefined}
                  >
                    {wh.name}
                  </Button>
                ))}
              </ScrollView>

              {selectedWh && (
                <Surface style={[styles.systemBox, { backgroundColor: colors.primarySurface }]} elevation={0}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>System Recorded Stock</Text>
                  <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '700' }}>
                    {Number(selectedWh.current_stock_mt).toFixed(2)} MT
                  </Text>
                </Surface>
              )}

              <TextInput
                label="Physically Counted Stock (MT) *"
                value={actualStock}
                onChangeText={setActualStock}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <TextInput
                label="Remarks / Variances Details"
                value={remarks}
                onChangeText={setRemarks}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Button
                mode="contained"
                onPress={handleSubmitAudit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.btn}
                buttonColor={colors.secondary}
              >
                Submit Audit Record
              </Button>
            </Card.Content>
          </Card>

          {/* Audit History */}
          <Text style={[styles.historyTitle, { color: colors.text }]}>Audit History</Text>
          {audits.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>No past audits found.</Text>
          ) : (
            audits.map(audit => (
              <Card key={audit.id} style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
                <Card.Content>
                  <View style={styles.auditRow}>
                    <Text style={[styles.auditCode, { color: colors.text }]}>{audit.audit_code}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(audit.audit_date)}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: Spacing.md }}>
                    Warehouse ID: {audit.warehouse_id}
                  </Text>
                  <View style={styles.grid}>
                    <View style={styles.gridBox}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>System</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{Number(audit.system_stock_mt).toFixed(2)}</Text>
                    </View>
                    <View style={styles.gridBox}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Actual</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{Number(audit.actual_stock_mt).toFixed(2)}</Text>
                    </View>
                    <View style={styles.gridBox}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Variance</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: Number(audit.variance_mt) !== 0 ? colors.error : colors.success }}>
                        {Number(audit.variance_mt).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  label: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs },
  systemBox: { padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md, alignItems: 'center' },
  input: { marginBottom: Spacing.md, backgroundColor: 'transparent' },
  btn: { marginTop: Spacing.md, borderRadius: BorderRadius.md, paddingVertical: 4 },
  historyTitle: { fontSize: FontSize.md, fontWeight: '700', marginTop: Spacing.md, marginBottom: Spacing.md },
  auditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  auditCode: { fontSize: FontSize.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: Spacing.md },
  gridBox: { flex: 1, alignItems: 'center' },
});
