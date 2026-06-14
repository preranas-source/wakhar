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
import { Text, TextInput, Button, Surface, HelperText, ToggleButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { t } from '@/i18n';
import { useAuth } from '@/store/authStore';
import { IntakeType } from '@/types';
import api from '@/utils/api';

export default function FPOIntakeScreen() {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const { fpo } = useAuth();
  
  const currentFpoId = fpo?.id || 1;

  // Form states
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(null);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number | null>(null);
  const [variety, setVariety] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [bagCount, setBagCount] = useState('');
  const [moisturePct, setMoisturePct] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [zone, setZone] = useState('');
  const [intakeType, setIntakeType] = useState<IntakeType>(IntakeType.WALK_IN);
  
  // Picker modal states
  const [pickerType, setPickerType] = useState<'farmer' | 'commodity' | 'warehouse' | null>(null);

  // Validation errors & UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data from API
  const [farmers, setFarmers] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (!fpo?.id) return;
    const fetchDependencies = async () => {
      try {
        const [farmRes, commRes, whRes] = await Promise.all([
          api.get(`/api/farmers?fpo_id=${currentFpoId}`),
          api.get('/api/commodities'),
          api.get(`/api/warehouses?fpo_id=${currentFpoId}`)
        ]);
        setFarmers(farmRes.data);
        setCommodities(commRes.data);
        setWarehouses(whRes.data);
        if (whRes.data.length > 0) {
          setSelectedWarehouseId(whRes.data[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load intake dependencies', err);
        // Only show alert if it's not an unauthorized error (e.g. from logout)
        if (err?.response?.status !== 401) {
          Alert.alert('Error', 'Failed to load form data from server.');
        }
      } finally {
        setLoadingDependencies(false);
      }
    };
    fetchDependencies();
  }, [currentFpoId, fpo?.id]);

  const getFarmerName = () => {
    return farmers.find(f => f.id === selectedFarmerId)?.name || 'Select Farmer';
  };

  const getCommodityName = () => {
    return commodities.find(c => c.id === selectedCommodityId)?.name || 'Select Commodity';
  };

  const getWarehouseName = () => {
    return warehouses.find(w => w.id === selectedWarehouseId)?.name || 'Select Warehouse';
  };

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!selectedFarmerId) tempErrors.farmer = 'Farmer is required';
    if (!selectedCommodityId) tempErrors.commodity = 'Commodity is required';
    if (!quantityKg || isNaN(Number(quantityKg)) || Number(quantityKg) <= 0) {
      tempErrors.quantity = 'Provide a valid quantity in kg';
    }
    if (!bagCount || isNaN(Number(bagCount)) || Number(bagCount) <= 0) {
      tempErrors.bags = 'Provide a valid bag count';
    }
    if (moisturePct && (isNaN(Number(moisturePct)) || Number(moisturePct) < 0 || Number(moisturePct) > 100)) {
      tempErrors.moisture = 'Moisture must be between 0% and 100%';
    }
    if (!selectedWarehouseId) tempErrors.warehouse = 'Warehouse is required';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const payload = {
      lot_code: `LOT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      farmer_id: selectedFarmerId,
      commodity_id: selectedCommodityId,
      variety: variety || null,
      quantity_kg: Number(quantityKg),
      bag_count: Number(bagCount),
      moisture_pct: moisturePct ? Number(moisturePct) : null,
      grade: 'pending',
      warehouse_id: selectedWarehouseId,
      zone: zone || null,
      status: 'qc_pending',
      intake_type: intakeType,
      intake_date: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await api.post('/api/lots/', payload);
      
      Alert.alert(
        'Intake Registered Successfully',
        `Lot code generated: ${response.data.lot_code}\nRegistered for farmer: ${getFarmerName()}\nQuantity: ${quantityKg} kg\n\nLot status set to QC_PENDING.`,
        [
          {
            text: 'View Lots',
            onPress: () => {
              setSelectedFarmerId(null);
              setSelectedCommodityId(null);
              setVariety('');
              setQuantityKg('');
              setBagCount('');
              setMoisturePct('');
              setZone('');
              router.push('/(fpo)/intake-list' as any);
            },
          },
          { text: 'OK', onPress: () => {} },
        ]
      );
    } catch (err) {
      console.error('Failed to submit intake', err);
      Alert.alert('Error', 'Could not register intake lot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPickerItems = () => {
    if (pickerType === 'farmer') {
      return (
        <FlatList
          data={farmers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setSelectedFarmerId(item.id);
                setPickerType(null);
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.farmer_code} | {item.village}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }
    if (pickerType === 'commodity') {
      return (
        <FlatList
          data={commodities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setSelectedCommodityId(item.id);
                setPickerType(null);
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }
    if (pickerType === 'warehouse') {
      return (
        <FlatList
          data={warehouses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setSelectedWarehouseId(item.id);
                setPickerType(null);
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Capacity: {item.capacity_mt} MT</Text>
            </TouchableOpacity>
          )}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              New Commodity Intake
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              Record incoming farmer deposits
            </Text>
          </View>
          <Button
            mode="outlined"
            compact
            onPress={() => router.push('/(fpo)/intake-list' as any)}
            textColor={colors.primary}
            style={{ borderColor: colors.primary, borderRadius: BorderRadius.md }}
            labelStyle={{ fontSize: 12 }}
          >
            Ledger 📋
          </Button>
        </View>

        {loadingDependencies ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Surface style={[styles.formCard, { backgroundColor: colors.card }]} elevation={1}>
              {/* Intake Type */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Intake Flow</Text>
              <View style={styles.toggleRow}>
                <ToggleButton.Row
                  onValueChange={(val) => setIntakeType(val as IntakeType)}
                  value={intakeType}
                  style={styles.toggleBtnGroup}
                >
                  <ToggleButton
                    icon="walk"
                    value={IntakeType.WALK_IN}
                    style={[styles.toggleBtn, intakeType === IntakeType.WALK_IN && { backgroundColor: colors.primary }]}
                  />
                  <ToggleButton
                    icon="clock-outline"
                    value={IntakeType.PRE_REGISTERED}
                    style={[styles.toggleBtn, intakeType === IntakeType.PRE_REGISTERED && { backgroundColor: colors.primary }]}
                  />
                </ToggleButton.Row>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  {intakeType === IntakeType.WALK_IN ? '🚶 Walk-In' : '📅 Pre-Registered'}
                </Text>
              </View>

              {/* Farmer Selection */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Farmer *</Text>
              <TouchableOpacity
                style={[styles.pickerTrigger, { borderColor: errors.farmer ? colors.error : colors.border }]}
                onPress={() => setPickerType('farmer')}
              >
                <Text style={{ color: selectedFarmerId ? colors.text : colors.textSecondary }}>
                  {getFarmerName()}
                </Text>
                <Text style={{ color: colors.textSecondary }}>▼</Text>
              </TouchableOpacity>
              {errors.farmer && <HelperText type="error">{errors.farmer}</HelperText>}

              {/* Commodity Selection */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Commodity *</Text>
              <TouchableOpacity
                style={[styles.pickerTrigger, { borderColor: errors.commodity ? colors.error : colors.border }]}
                onPress={() => setPickerType('commodity')}
              >
                <Text style={{ color: selectedCommodityId ? colors.text : colors.textSecondary }}>
                  {getCommodityName()}
                </Text>
                <Text style={{ color: colors.textSecondary }}>▼</Text>
              </TouchableOpacity>
              {errors.commodity && <HelperText type="error">{errors.commodity}</HelperText>}

              {/* Variety */}
              <TextInput
                label="Variety / Grade (e.g. Basmati, Lokwan)"
                value={variety}
                onChangeText={setVariety}
                style={styles.input}
                mode="outlined"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              {/* Quantity and Bags */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <TextInput
                    label="Net Quantity (kg) *"
                    value={quantityKg}
                    onChangeText={(text) => { setQuantityKg(text); setErrors(prev => ({ ...prev, quantity: '' })); }}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    outlineColor={errors.quantity ? colors.error : colors.border}
                    activeOutlineColor={colors.primary}
                  />
                  {errors.quantity && <HelperText type="error">{errors.quantity}</HelperText>}
                </View>

                <View style={styles.col}>
                  <TextInput
                    label="Bag Count *"
                    value={bagCount}
                    onChangeText={(text) => { setBagCount(text); setErrors(prev => ({ ...prev, bags: '' })); }}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    outlineColor={errors.bags ? colors.error : colors.border}
                    activeOutlineColor={colors.primary}
                  />
                  {errors.bags && <HelperText type="error">{errors.bags}</HelperText>}
                </View>
              </View>

              {/* Moisture Content */}
              <TextInput
                label="Moisture % (Optional)"
                value={moisturePct}
                onChangeText={(text) => { setMoisturePct(text); setErrors(prev => ({ ...prev, moisture: '' })); }}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor={errors.moisture ? colors.error : colors.border}
                activeOutlineColor={colors.primary}
                right={<TextInput.Affix text="%" />}
              />
              {errors.moisture && <HelperText type="error">{errors.moisture}</HelperText>}

              {/* Warehouse */}
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Warehouse *</Text>
              <TouchableOpacity
                style={[styles.pickerTrigger, { borderColor: errors.warehouse ? colors.error : colors.border }]}
                onPress={() => setPickerType('warehouse')}
              >
                <Text style={{ color: selectedWarehouseId ? colors.text : colors.textSecondary }}>
                  {getWarehouseName()}
                </Text>
                <Text style={{ color: colors.textSecondary }}>▼</Text>
              </TouchableOpacity>
              {errors.warehouse && <HelperText type="error">{errors.warehouse}</HelperText>}

              {/* Zone */}
              <TextInput
                label="Zone / Rack Location (Optional)"
                value={zone}
                onChangeText={setZone}
                placeholder="e.g. Zone A - Rack 3"
                style={styles.input}
                mode="outlined"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              {/* Submit Button */}
              <Button
                mode="contained"
                buttonColor={colors.primary}
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.submitBtn}
                contentStyle={styles.submitBtnContent}
              >
                Submit Intake Lot
              </Button>
            </Surface>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Select Picker Modal */}
      <Modal visible={pickerType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Surface style={[styles.modalCard, { backgroundColor: colors.card }]} elevation={5}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select {pickerType ? pickerType.toUpperCase() : ''}
              </Text>
              <Button onPress={() => setPickerType(null)} textColor={colors.primary}>Close</Button>
            </View>
            <Divider />
            {renderPickerItems()}
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
  fieldLabel: { fontSize: 12, fontWeight: '600', marginTop: Spacing.md, marginBottom: Spacing.xs },
  pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: BorderRadius.sm, padding: Spacing.lg, marginVertical: Spacing.xs, backgroundColor: '#FDFDFD' },
  input: { marginVertical: Spacing.xs, backgroundColor: '#FDFDFD' },
  row: { flexDirection: 'row', gap: Spacing.md },
  col: { flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.sm },
  toggleBtnGroup: { borderWidth: 1, borderColor: '#CCC', borderRadius: BorderRadius.sm, overflow: 'hidden' },
  toggleBtn: { width: 60, height: 40 },
  toggleLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  submitBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.md },
  submitBtnContent: { paddingVertical: Spacing.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '70%', padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.md, fontWeight: '700' },
  pickerItem: { paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
