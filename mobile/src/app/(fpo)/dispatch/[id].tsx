import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Surface, IconButton, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { DispatchStatus } from '@/types';
import api from '@/utils/api';

export default function FPODispatchDetailScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [dn, setDn] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>(DispatchStatus.CREATED);

  useEffect(() => {
    const fetchDispatchNote = async () => {
      try {
        const response = await api.get(`/api/dispatch-notes/${id}`);
        setDn(response.data);
        setCurrentStatus(response.data.status);
        
        // Ensure timeline events are sorted
        const sortedTimeline = (response.data.timeline_events || []).sort(
          (a: any, b: any) => a.event_order - b.event_order
        );
        setTimeline(sortedTimeline);
      } catch (err) {
        console.error('Failed to load dispatch details', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDispatchNote();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!dn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Dispatch note not found.
          </Text>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleEPOD = () => {
    Alert.alert(
      'Confirm Delivery e-POD',
      'Sign and verify digital Proof of Delivery for this shipment?',
      [
        { text: 'Cancel' },
        {
          text: 'Sign & Confirm',
          onPress: async () => {
            try {
              // Update dispatch note status
              await api.put(`/api/dispatch-notes/${id}`, {
                ...dn,
                status: DispatchStatus.DELIVERED,
                delivery_date: new Date().toISOString()
              });

              // Add timeline event
              const newEvent = {
                dispatch_note_id: Number(id),
                title: 'Delivery e-POD completed & signed',
                subtitle: 'Signed via mobile app by dispatcher',
                is_done: true,
                is_active: false,
                event_order: timeline.length + 1,
                event_date: new Date().toISOString()
              };
              const eventRes = await api.post(`/api/dispatch-notes/${id}/timeline`, newEvent);

              // Update lot status
              const lotRes = await api.get(`/api/lots/${dn.lot_id}`);
              await api.put(`/api/lots/${dn.lot_id}`, {
                ...lotRes.data,
                status: 'delivered'
              });

              // Also update corresponding Warehouse Receipt to 'withdrawn' if it exists
              try {
                const wrRes = await api.get(`/api/warehouse-receipts?lot_id=${dn.lot_id}`);
                if (wrRes.data && wrRes.data.length > 0) {
                  const wr = wrRes.data[0];
                  await api.put(`/api/warehouse-receipts/${wr.id}`, {
                    ...wr,
                    status: 'withdrawn'
                  });
                }
              } catch (wrErr) {
                console.error('Failed to update warehouse receipt status during dispatch delivery', wrErr);
              }

              setCurrentStatus(DispatchStatus.DELIVERED);
              setTimeline([...timeline.map(e => ({ ...e, is_active: false })), eventRes.data]);

              Alert.alert('Delivery Verified', 'The shipment has been successfully marked as DELIVERED.');
            } catch (err) {
              console.error('Failed to update e-POD', err);
              Alert.alert('Error', 'Could not verify delivery.');
            }
          },
        },
      ]
    );
  };
  const handleStartTransit = () => {
    Alert.alert(
      'Confirm Start Transit',
      'Mark this shipment as In Transit and record vehicle Gate Out?',
      [
        { text: 'Cancel' },
        {
          text: 'Confirm Gate Out',
          onPress: async () => {
            try {
              // Update dispatch note status
              await api.put(`/api/dispatch-notes/${id}`, {
                ...dn,
                status: DispatchStatus.IN_TRANSIT,
              });

              // Add timeline event
              const newEvent = {
                dispatch_note_id: Number(id),
                title: 'Dispatched & Gate Out complete',
                subtitle: 'Vehicle is now in transit to destination',
                is_done: true,
                is_active: true,
                event_order: timeline.length + 1,
                event_date: new Date().toISOString()
              };
              const eventRes = await api.post(`/api/dispatch-notes/${id}/timeline`, newEvent);

              setCurrentStatus(DispatchStatus.IN_TRANSIT);
              setTimeline([...timeline.map(e => ({ ...e, is_active: false, is_done: true })), eventRes.data]);

              Alert.alert('Vehicle Dispatched', 'The shipment is now marked as IN TRANSIT.');
            } catch (err) {
              console.error('Failed to start transit', err);
              Alert.alert('Error', 'Could not start transit.');
            }
          },
        },
      ]
    );
  };

  const getStatusColorConfig = (status: string) => {
    switch (status) {
      case DispatchStatus.CREATED:
        return colors.info;
      case DispatchStatus.IN_TRANSIT:
        return colors.warning;
      case DispatchStatus.DELIVERED:
        return colors.primary;
      case DispatchStatus.CANCELLED:
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const activeStatusColor = getStatusColorConfig(currentStatus);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Shipment Tracking
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top details card */}
        <Card style={[styles.summaryCard, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <View style={styles.codeRow}>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                {dn.dn_code}
              </Text>
              <Surface style={[styles.badge, { backgroundColor: activeStatusColor + '15' }]} elevation={0}>
                <Text style={[styles.badgeText, { color: activeStatusColor }]}>
                  {currentStatus.replace('_', ' ').toUpperCase()}
                </Text>
              </Surface>
            </View>

            <Text style={[styles.commodityTitle, { color: colors.text }]}>
              {dn.commodity_desc}
            </Text>
            <Text style={[styles.qtyText, { color: colors.primary, fontWeight: '700' }]}>
              Quantity: {dn.quantity_desc}
            </Text>
          </Card.Content>
        </Card>

        {/* Transportation Details */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
              Transport Details
            </Text>
            <InfoRow label="Destination" value={dn.destination} />
            <InfoRow label="Vehicle Number" value={dn.vehicle_reg} />
            <InfoRow label="e-Way Bill No." value={dn.e_way_bill_no || '—'} />
            <InfoRow label="GPS Tracker ID" value={dn.traccar_device_id || 'Not Assigned'} />
            <InfoRow label="Dispatch Date" value={formatDate(dn.dispatch_date)} />
            {dn.delivery_date && <InfoRow label="Delivery Date" value={formatDate(dn.delivery_date)} />}
          </Card.Content>
        </Card>

        {/* Visual Timeline Tracking */}
        <Card style={[styles.card, { backgroundColor: colors.card }]} elevation={1}>
          <Card.Content>
            <Text style={[styles.cardSectionTitle, { color: colors.text }]}>
              Shipment Timeline
            </Text>
            
            {timeline.length === 0 && (
              <Text style={{ color: colors.textSecondary }}>No events recorded.</Text>
            )}

            {timeline.map((event, index) => {
              let dotColor: string = colors.border;
              if (event.is_done) dotColor = colors.primary;
              else if (event.is_active) dotColor = colors.info;

              return (
                <View key={event.id} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <Surface
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: dotColor,
                          borderWidth: event.is_active ? 2 : 0,
                          borderColor: colors.infoSurface,
                        },
                      ]}
                      elevation={event.is_active ? 2 : 0}
                    >
                      <View />
                    </Surface>
                    {index < timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineTitleText,
                        { color: event.is_done || event.is_active ? colors.text : colors.textTertiary },
                      ]}
                    >
                      {event.title}
                    </Text>
                    {event.subtitle && (
                      <Text style={[styles.timelineSubtitleText, { color: colors.textSecondary }]}>
                        {event.subtitle}
                      </Text>
                    )}
                    {event.event_date && (
                      <Text style={[styles.timelineDateText, { color: colors.textTertiary }]}>
                        {formatDateTime(event.event_date)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Action Buttons based on status */}
        {currentStatus === DispatchStatus.CREATED && (
          <Button
            mode="contained"
            buttonColor={colors.secondary}
            onPress={handleStartTransit}
            style={styles.podBtn}
            contentStyle={{ paddingVertical: Spacing.sm }}
            icon="truck-delivery"
          >
            Start Transit (Gate Out)
          </Button>
        )}

        {currentStatus === DispatchStatus.IN_TRANSIT && (
          <Button
            mode="contained"
            buttonColor={colors.primary}
            onPress={handleEPOD}
            style={styles.podBtn}
            contentStyle={{ paddingVertical: Spacing.sm }}
            icon="signature"
          >
            Capture e-POD (Sign Handover)
          </Button>
        )}
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
  commodityTitle: { fontSize: FontSize.lg, fontWeight: '700' },
  qtyText: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  cardSectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm },
  infoVal: { fontSize: FontSize.sm, fontWeight: '600' },
  timelineItem: { flexDirection: 'row', minHeight: 80 },
  timelineIndicator: { width: 24, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.lg },
  timelineTitleText: { fontSize: FontSize.sm, fontWeight: '700' },
  timelineSubtitleText: { fontSize: FontSize.xs, marginTop: 2 },
  timelineDateText: { fontSize: 10, marginTop: 4 },
  podBtn: { marginTop: Spacing.md, borderRadius: BorderRadius.lg },
});
