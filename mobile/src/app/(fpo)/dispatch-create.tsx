import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { LotStatus } from '@/types';
import api from '@/utils/api';

export default function FPODispatchScreen() {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const { lotId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLots, setAvailableLots] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [preselectedLot, setPreselectedLot] = useState<any>(null);

  // Form states
  const [selectedLotId, setSelectedLotId] = useState<number | null>(lotId ? Number(lotId) : null);
  const [destination, setDestination] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [ewayBill, setEwayBill] = useState('');
  const [traccarId, setTraccarId] = useState('');
  const [dispatchQuantity, setDispatchQuantity] = useState('');

  // Dropdown states
  const [lotPickerVisible, setLotPickerVisible] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const lot = preselectedLot || availableLots.find(l => l.id === selectedLotId);
    if (lot) {
      setDispatchQuantity(lot.quantity_kg.toString());
    }
  }, [selectedLotId, preselectedLot, availableLots]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lotsRes, commRes] = await Promise.all([
          api.get('/api/lots?status=available'),
          api.get('/api/commodities')
        ]);
        setAvailableLots(lotsRes.data);
        setCommodities(commRes.data);
        
        if (lotId) {
          const matchingLot = lotsRes.data.find((l: any) => l.id === Number(lotId));
          if (matchingLot) {
            setPreselectedLot(matchingLot);
          } else {
            // Might have been fetched directly if not in 'available' or just missing
            const singleLotRes = await api.get(`/api/lots/${lotId}`);
            setPreselectedLot(singleLotRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch available lots for dispatch', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lotId]);

  const getCommodityById = (id: number) => commodities.find(c => c.id === id);

  const getSelectedLotLabel = () => {
    const lot = preselectedLot || availableLots.find(l => l.id === selectedLotId);
    if (!lot) return 'Select Lot';
    const comm = getCommodityById(lot.commodity_id);
    return `${lot.lot_code} — ${comm ? comm.name : ''} (${lot.quantity_kg} kg)`;
  };

  const validate = () => {
    const temp: Record<string, string> = {};
    if (!selectedLotId) temp.lot = 'Please select a lot to dispatch';
    if (!destination.trim()) temp.destination = 'Destination is required';
    if (!vehicleReg.trim()) temp.vehicle = 'Vehicle registration number is required';
    
    if (!dispatchQuantity || isNaN(Number(dispatchQuantity)) || Number(dispatchQuantity) <= 0) {
      temp.quantity = 'Valid dispatch quantity is required';
    } else {
      const lot = preselectedLot || availableLots.find(l => l.id === selectedLotId);
      if (lot && Number(dispatchQuantity) > Number(lot.quantity_kg)) {
        temp.quantity = `Cannot dispatch more than available (${lot.quantity_kg} kg)`;
      }
    }
    
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const lot = preselectedLot || availableLots.find(l => l.id === selectedLotId);
    const comm = getCommodityById(lot.commodity_id);
    
    const dnCode = `DN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const dispatchPayload = {
      dn_code: dnCode,
      lot_id: selectedLotId,
      dispatch_quantity_kg: Number(dispatchQuantity),
      commodity_desc: `${comm ? comm.name : 'Unknown'} (${lot.variety || 'Standard'})`,
      quantity_desc: `${lot.bag_count} bags / ${lot.quantity_kg} kg`,
      destination: destination,
      vehicle_reg: vehicleReg,
      traccar_device_id: traccarId || null,
      e_way_bill_no: ewayBill || null,
      status: 'created',
      dispatch_date: new Date().toISOString()
    };

    try {
      const dnRes = await api.post('/api/dispatch-notes/', dispatchPayload);
      const createdDN = dnRes.data;

      // Create initial timeline event for gate pass creation
      const initialEvent = {
        dispatch_note_id: createdDN.id,
        title: 'Dispatch Note Gate Pass Created',
        subtitle: `Generated for vehicle ${vehicleReg}`,
        is_done: true,
        is_active: true,
        event_order: 1,
        event_date: new Date().toISOString()
      };
      await api.post(`/api/dispatch-notes/${createdDN.id}/timeline`, initialEvent);
      
      // The backend now automatically handles lot status updates and splitting based on dispatch_quantity_kg

      Alert.alert(
        'Dispatch Note Generated',
        `Dispatch code: ${dnCode}\nVehicle: ${vehicleReg}\nDestination: ${destination}\nQuantity: ${dispatchQuantity} kg\n\nDispatch created successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(fpo)/dispatches' as any);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Failed to create dispatch note', err);
      if (err.response?.data) {
        console.error('Server error details:', JSON.stringify(err.response.data, null, 2));
      }
      Alert.alert(
        'Error',
        `Failed to generate dispatch note: ${
          err.response?.data?.detail || err.message || 'Unknown server error'
        }`
      );
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Dispatch Note
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Generate shipping documents and assign vehicle tracking
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Surface style={[styles.formCard, { backgroundColor: colors.card }]} elevation={1}>
            
            {/* Lot selection */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Select Lot to Dispatch *</Text>
            {preselectedLot ? (
              <Surface style={[styles.preselectedBox, { backgroundColor: colors.background }]} elevation={0}>
                <Text style={[styles.preselectedText, { color: colors.text }]}>
                  {getSelectedLotLabel()}
                </Text>
              </Surface>
            ) : (
              <TouchableOpacity
                style={[styles.pickerTrigger, { borderColor: errors.lot ? colors.error : colors.border }]}
                onPress={() => setLotPickerVisible(true)}
              >
                <Text style={{ color: selectedLotId ? colors.text : colors.textSecondary }}>
                  {getSelectedLotLabel()}
                </Text>
                <Text style={{ color: colors.textSecondary }}>▼</Text>
              </TouchableOpacity>
            )}
            {errors.lot && <HelperText type="error">{errors.lot}</HelperText>}

            {/* Dispatch Quantity */}
            <TextInput
              label={`Dispatch Quantity (kg) * Max: ${
                (preselectedLot || availableLots.find(l => l.id === selectedLotId))?.quantity_kg || 0
              }`}
              value={dispatchQuantity}
              onChangeText={(text) => { setDispatchQuantity(text); setErrors(prev => ({ ...prev, quantity: '' })); }}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.quantity ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
            />
            {errors.quantity && <HelperText type="error">{errors.quantity}</HelperText>}

            {/* Destination */}
            <TextInput
              label="Shipping Destination *"
              value={destination}
              onChangeText={(text) => { setDestination(text); setErrors(prev => ({ ...prev, destination: '' })); }}
              placeholder="e.g. Satara Aggregator, Phaltan WH"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.destination ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
            />
            {errors.destination && <HelperText type="error">{errors.destination}</HelperText>}

            {/* Vehicle Reg */}
            <TextInput
              label="Vehicle Registration Number *"
              value={vehicleReg}
              onChangeText={(text) => { setVehicleReg(text); setErrors(prev => ({ ...prev, vehicle: '' })); }}
              placeholder="e.g. MH-12-PQ-9080"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.vehicle ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
              autoCapitalize="characters"
            />
            {errors.vehicle && <HelperText type="error">{errors.vehicle}</HelperText>}

            {/* NIC e-Way Bill */}
            <TextInput
              label="e-Way Bill Number (Optional)"
              value={ewayBill}
              onChangeText={setEwayBill}
              placeholder="e.g. EWB-MH-2026-00890"
              style={styles.input}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            {/* Traccar Device ID */}
            <TextInput
              label="GPS Tracker ID / Device ID (Optional)"
              value={traccarId}
              onChangeText={setTraccarId}
              placeholder="e.g. TRC-9012"
              style={styles.input}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            {/* Submit */}
            <Button
              mode="contained"
              buttonColor={colors.secondary}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitBtn}
              contentStyle={{ paddingVertical: Spacing.xs }}
            >
              Confirm Dispatch
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Lot Picker Modal */}
      <Modal visible={lotPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalCard, { backgroundColor: colors.card }]} elevation={5}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Lot</Text>
              <Button onPress={() => setLotPickerVisible(false)} textColor={colors.primary}>Close</Button>
            </View>
            <Divider />
            <FlatList
              data={availableLots}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const comm = getCommodityById(item.commodity_id);
                return (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedLotId(item.id);
                      setLotPickerVisible(false);
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{item.lot_code}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {comm ? comm.name : ''} | {item.quantity_kg} kg | Grade: {item.grade.replace('grade_', '').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={{ padding: Spacing.xl, textAlign: 'center', color: colors.textSecondary }}>
                  No available lots in warehouse. Please grade pending lots first.
                </Text>
              }
            />
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  headerSub: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  formCard: { padding: Spacing.xl, borderRadius: BorderRadius.lg },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs },
  preselectedBox: { padding: Spacing.lg, borderRadius: BorderRadius.sm, marginVertical: Spacing.xs },
  preselectedText: { fontWeight: '600' },
  pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: BorderRadius.sm, padding: Spacing.lg, marginVertical: Spacing.xs, backgroundColor: '#FDFDFD' },
  input: { marginVertical: Spacing.xs, backgroundColor: '#FDFDFD' },
  submitBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '60%', padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.md, fontWeight: '700' },
  pickerItem: { paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
