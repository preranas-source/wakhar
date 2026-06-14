import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, Button, Surface, Chip, HelperText, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { QCGrade } from '@/types';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FPOGradingScreen() {
  const colors = getColors(useColorScheme());
  const router = useRouter();
  const { lotId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lot, setLot] = useState<any>(null);
  const [comm, setComm] = useState<any>(null);

  // Form states
  const [moisture, setMoisture] = useState('');
  const [foreignMatter, setForeignMatter] = useState('');
  const [brokenGrain, setBrokenGrain] = useState('');
  const [protein, setProtein] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<QCGrade>(QCGrade.GRADE_A);
  const [remarks, setRemarks] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLotAndCommodity = async () => {
      try {
        const lotRes = await api.get(`/api/lots/${lotId}`);
        setLot(lotRes.data);
        if (lotRes.data.moisture_pct) {
          setMoisture(lotRes.data.moisture_pct.toString());
        }
        const commRes = await api.get(`/api/commodities/${lotRes.data.commodity_id}`);
        setComm(commRes.data);
      } catch (err) {
        console.error('Failed to fetch lot for grading', err);
        Alert.alert('Error', 'Failed to load lot data');
      } finally {
        setLoading(false);
      }
    };
    if (lotId) fetchLotAndCommodity();
  }, [lotId]);

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
          <Text style={[styles.errorText, { color: colors.error }]}>Lot not specified.</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const validate = () => {
    const temp: Record<string, string> = {};
    if (!moisture || isNaN(Number(moisture)) || Number(moisture) < 0 || Number(moisture) > 100) {
      temp.moisture = 'Moisture must be a percentage between 0 and 100';
    }
    if (foreignMatter && (isNaN(Number(foreignMatter)) || Number(foreignMatter) < 0 || Number(foreignMatter) > 100)) {
      temp.foreignMatter = 'Must be a valid percentage';
    }
    if (brokenGrain && (isNaN(Number(brokenGrain)) || Number(brokenGrain) < 0 || Number(brokenGrain) > 100)) {
      temp.brokenGrain = 'Must be a valid percentage';
    }
    if (protein && (isNaN(Number(protein)) || Number(protein) < 0 || Number(protein) > 100)) {
      temp.protein = 'Must be a valid percentage';
    }

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const certCode = `QC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
    const newStatus = selectedGrade === QCGrade.REJECTED ? 'returned' : 'available';

    const qcPayload = {
      qc_code: certCode,
      lot_id: Number(lotId),
      moisture_pct: Number(moisture),
      foreign_matter_pct: foreignMatter ? Number(foreignMatter) : null,
      broken_grain_pct: brokenGrain ? Number(brokenGrain) : null,
      protein_pct: protein ? Number(protein) : null,
      grade_awarded: selectedGrade,
      inspected_by: user?.id || 1,
      inspection_date: new Date().toISOString(),
      remarks: remarks || null
    };

    const lotUpdatePayload = {
      ...lot,
      status: newStatus,
      grade: selectedGrade,
      moisture_pct: Number(moisture)
    };

    try {
      // Create Quality Record
      await api.post('/api/quality-records/', qcPayload);
      
      // Update Lot status and grade
      await api.put(`/api/lots/${lotId}`, lotUpdatePayload);

      Alert.alert(
        'Grading Certificate Created',
        `Certificate generated: ${certCode}\nGrade Awarded: ${selectedGrade.replace('grade_', 'Grade ').toUpperCase()}\n\nLot status updated to: ${newStatus.toUpperCase()}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace(`/(fpo)/lot/${lotId}` as any);
            },
          },
        ]
      );
    } catch (err) {
      console.error('Failed to submit QC', err);
      Alert.alert('Error', 'Failed to submit quality record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Quality Control & Grading
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Evaluating: {lot.lot_code} ({comm ? comm.name : ''})
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Surface style={[styles.formCard, { backgroundColor: colors.card }]} elevation={1}>
            
            {/* Grade Selection */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Awarded Grade *</Text>
            <View style={styles.gradeContainer}>
              {Object.values(QCGrade).map(grade => {
                const active = selectedGrade === grade;
                return (
                  <Chip
                    key={grade}
                    selected={active}
                    onPress={() => setSelectedGrade(grade)}
                    style={[
                      styles.gradeChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceVariant,
                      },
                    ]}
                    textStyle={{
                      color: active ? colors.onPrimary : colors.text,
                      fontWeight: '700',
                      fontSize: 11,
                    }}
                    showSelectedOverlay={false}
                  >
                    {grade.replace('grade_', 'Grade ').toUpperCase()}
                  </Chip>
                );
              })}
            </View>

            <Divider style={styles.divider} />

            {/* Quality Parameters */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Parameters</Text>

            {/* Moisture input */}
            <TextInput
              label="Moisture % *"
              value={moisture}
              onChangeText={(text) => { setMoisture(text); setErrors(prev => ({ ...prev, moisture: '' })); }}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.moisture ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
              right={<TextInput.Affix text="%" />}
            />
            {errors.moisture && <HelperText type="error">{errors.moisture}</HelperText>}

            {/* Foreign Matter */}
            <TextInput
              label="Foreign Matter %"
              value={foreignMatter}
              onChangeText={(text) => { setForeignMatter(text); setErrors(prev => ({ ...prev, foreignMatter: '' })); }}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.foreignMatter ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
              right={<TextInput.Affix text="%" />}
            />
            {errors.foreignMatter && <HelperText type="error">{errors.foreignMatter}</HelperText>}

            {/* Broken Grain */}
            <TextInput
              label="Broken Grain %"
              value={brokenGrain}
              onChangeText={(text) => { setBrokenGrain(text); setErrors(prev => ({ ...prev, brokenGrain: '' })); }}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.brokenGrain ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
              right={<TextInput.Affix text="%" />}
            />
            {errors.brokenGrain && <HelperText type="error">{errors.brokenGrain}</HelperText>}

            {/* Protein */}
            <TextInput
              label="Protein % (Optional)"
              value={protein}
              onChangeText={(text) => { setProtein(text); setErrors(prev => ({ ...prev, protein: '' })); }}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              outlineColor={errors.protein ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
              right={<TextInput.Affix text="%" />}
            />
            {errors.protein && <HelperText type="error">{errors.protein}</HelperText>}

            {/* Remarks */}
            <TextInput
              label="Inspection Remarks"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
              style={[styles.input, { minHeight: 80 }]}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            {/* Submit */}
            <Button
              mode="contained"
              buttonColor={colors.primary}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitBtn}
              contentStyle={{ paddingVertical: Spacing.xs }}
            >
              Issue Certificate & Grade
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  headerSub: { fontSize: FontSize.sm, marginTop: Spacing.xs },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.md },
  scrollContent: { padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  formCard: { padding: Spacing.xl, borderRadius: BorderRadius.lg },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs },
  gradeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginVertical: Spacing.xs },
  gradeChip: { borderRadius: BorderRadius.sm, height: 36 },
  divider: { marginVertical: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  input: { marginVertical: Spacing.xs, backgroundColor: '#FDFDFD' },
  submitBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.md },
});
