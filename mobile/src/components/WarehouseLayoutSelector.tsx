import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Text, Surface, Portal, Modal, Button } from 'react-native-paper';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';

interface WarehouseLayoutSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (zoneInfo: string) => void;
  currentZone?: string;
}

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Cold Storage'];
const RACKS = ['Rack 1', 'Rack 2', 'Rack 3', 'Rack 4'];
const BINS = ['Bin 1', 'Bin 2', 'Bin 3', 'Bin 4', 'Bin 5', 'Floor'];

export default function WarehouseLayoutSelector({
  visible,
  onDismiss,
  onSelect,
  currentZone = '',
}: WarehouseLayoutSelectorProps) {
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  // Parse current zone if exists, e.g. "Zone A - Rack 2 - Bin 1"
  const parts = currentZone.split(' - ');
  const [selectedZone, setSelectedZone] = useState<string>(parts[0] || ZONES[0]);
  const [selectedRack, setSelectedRack] = useState<string>(parts[1] || RACKS[0]);
  const [selectedBin, setSelectedBin] = useState<string>(parts[2] || BINS[0]);

  const handleConfirm = () => {
    onSelect(`${selectedZone} - ${selectedRack} - ${selectedBin}`);
  };

  const renderGrid = (items: string[], selected: string, onSelectCb: (val: string) => void) => {
    return (
      <View style={styles.grid}>
        {items.map(item => {
          const isActive = selected === item;
          return (
            <TouchableOpacity key={item} onPress={() => onSelectCb(item)} activeOpacity={0.7} style={styles.gridItem}>
              <Surface
                style={[
                  styles.gridSurface,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                elevation={isActive ? 2 : 0}
              >
                <Text style={{ color: isActive ? colors.onPrimary : colors.text, fontWeight: isActive ? '700' : '500', fontSize: FontSize.xs }}>
                  {item}
                </Text>
              </Surface>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Allocate Storage Location</Text>

        <ScrollView>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Zone</Text>
          {renderGrid(ZONES, selectedZone, setSelectedZone)}

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Rack</Text>
          {renderGrid(RACKS, selectedRack, setSelectedRack)}

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Select Bin / Level</Text>
          {renderGrid(BINS, selectedBin, setSelectedBin)}
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="text" onPress={onDismiss} textColor={colors.textSecondary}>Cancel</Button>
          <Button mode="contained" onPress={handleConfirm} buttonColor={colors.primary}>Confirm Location</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxHeight: '80%',
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.lg },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridItem: { width: '31%' },
  gridSurface: { paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
});
