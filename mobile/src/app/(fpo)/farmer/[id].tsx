import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Avatar, IconButton, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatWeight, formatDate } from '@/utils/formatters';
import api from '@/utils/api';

export default function FarmerProfileScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [farmerRes, lotsRes] = await Promise.all([
          api.get(`/api/farmers/${id}`),
          api.get(`/api/lots?farmer_id=${id}`)
        ]);
        setFarmer(farmerRes.data);
        setLots(lotsRes.data || []);
      } catch (error) {
        console.error('Failed to load farmer details', error);
        Alert.alert('Error', 'Could not load farmer profile.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!farmer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = farmer.name
    ? farmer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FM';

  const activeLots = lots.filter(l => !['in_transit', 'delivered', 'withdrawn'].includes(l.status));
  const totalActiveDeposits = activeLots.reduce((acc, l) => acc + Number(l.quantity_kg), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Farmer Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Summary Card */}
        <Card style={[styles.card, { backgroundColor: colors.card, alignItems: 'center', paddingTop: Spacing.xl }]} elevation={1}>
          <Avatar.Text
            size={80}
            label={initials}
            style={{ backgroundColor: colors.primarySurface, marginBottom: Spacing.md }}
            labelStyle={{ color: colors.primary, fontWeight: '700', fontSize: 32 }}
          />
          <Text style={[styles.nameTitle, { color: colors.text }]}>{farmer.name}</Text>
          <Text style={[styles.codeText, { color: colors.textSecondary }]}>{farmer.farmer_code}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{farmer.phone}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Village</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{farmer.village || 'N/A'}</Text>
            </View>
          </View>
        </Card>

        {/* Total Active Deposits */}
        <Card style={[styles.card, { backgroundColor: colors.primarySurface }]} elevation={0}>
          <Card.Content style={styles.depositContent}>
            <View>
              <Text style={[styles.depositTitle, { color: colors.primary }]}>Total Active Deposits</Text>
              <Text style={[styles.depositSub, { color: colors.textSecondary }]}>Currently in warehouse</Text>
            </View>
            <Text style={[styles.depositAmount, { color: colors.primary }]}>{formatWeight(totalActiveDeposits)}</Text>
          </Card.Content>
        </Card>

        {/* Active Lots List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Commodities ({activeLots.length})</Text>
        {activeLots.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No active deposits found.</Text>
        ) : (
          activeLots.map((lot) => (
            <Card key={lot.id} style={[styles.lotCard, { backgroundColor: colors.card }]} elevation={1}>
              <Card.Content style={styles.lotRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lotCode, { color: colors.text }]}>{lot.lot_code}</Text>
                  <Text style={[styles.lotCommodity, { color: colors.textSecondary }]}>
                    {lot.commodity?.name || 'Commodity'} • {lot.variety || 'N/A'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.lotQty, { color: colors.text }]}>{formatWeight(lot.quantity_kg)}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{formatDate(lot.intake_date)}</Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.xl },
  nameTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  codeText: { fontSize: FontSize.sm, marginTop: Spacing.xs, marginBottom: Spacing.lg },
  infoGrid: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderColor: '#F0F0F0' },
  infoBox: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRightWidth: 1, borderColor: '#F0F0F0' },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoVal: { fontSize: FontSize.sm, fontWeight: '600' },
  depositContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depositTitle: { fontSize: FontSize.md, fontWeight: '700' },
  depositSub: { fontSize: 11, marginTop: 2 },
  depositAmount: { fontSize: FontSize.xl, fontWeight: '700' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.md },
  lotCard: { borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  lotRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  lotCode: { fontSize: FontSize.sm, fontWeight: '700' },
  lotCommodity: { fontSize: FontSize.xs, marginTop: 2 },
  lotQty: { fontSize: FontSize.md, fontWeight: '600', color: '#000' },
});
