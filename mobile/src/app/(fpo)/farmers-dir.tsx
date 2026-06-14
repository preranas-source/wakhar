import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Avatar, Searchbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getColors, Spacing, BorderRadius, FontSize } from '@/constants/theme';
import { formatWeight } from '@/utils/formatters';
import { useAuth } from '@/store/authStore';
import api from '@/utils/api';

export default function FPOFarmersScreen() {
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const router = useRouter();
  const { fpo } = useAuth();

  const currentFpoId = fpo?.id || 1;
  
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchFarmers = async () => {
        try {
          const response = await api.get(`/api/farmers?fpo_id=${currentFpoId}`);
          setFarmers(response.data);
        } catch (err) {
          console.error('Failed to load farmers', err);
        } finally {
          setLoading(false);
        }
      };
      fetchFarmers();
    }, [currentFpoId])
  );

  // Filter farmers by search query
  const FpoFarmersList = farmers.filter(f => {
    const query = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(query) ||
      f.farmer_code.toLowerCase().includes(query) ||
      (f.village?.toLowerCase().includes(query) ?? false) ||
      (f.phone && f.phone.includes(query))
    );
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <IconButton icon="arrow-left" iconColor={colors.text} size={24} onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Farmers Directory
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search farmer name, village..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.card }]}
          inputStyle={{ color: colors.text }}
          placeholderTextColor={colors.textSecondary}
          iconColor={colors.textSecondary}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={FpoFarmersList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🧑‍🌾</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No farmers found</Text>
            </View>
          }
          renderItem={({ item: farmer }) => {
            const initials = farmer.name
              ? farmer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'FM';

            return (
              <Card 
                style={[styles.card, { backgroundColor: colors.card }]} 
                elevation={1}
                onPress={() => router.push(`/(fpo)/farmer/${farmer.id}` as any)}
              >
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text
                    size={46}
                    label={initials}
                    style={{ backgroundColor: colors.primarySurface }}
                    labelStyle={{ color: colors.primary, fontWeight: '700' }}
                  />
                  <View style={styles.infoCol}>
                    <Text style={[styles.name, { color: colors.text }]}>{farmer.name}</Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>
                      ID: {farmer.farmer_code} | Village: {farmer.village || 'N/A'}
                    </Text>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>
                      Phone: {farmer.phone}
                    </Text>
                  </View>
                  <View style={styles.depositCol}>
                    <Text style={[styles.depositLabel, { color: colors.textSecondary }]}>
                      Deposits
                    </Text>
                    <Text style={[styles.depositVal, { color: colors.primary }]}>
                      {formatWeight(farmer.total_deposit_kg || 0)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
        />
      )}
      
      <IconButton
        icon="plus"
        mode="contained"
        containerColor={colors.primary}
        iconColor={colors.onPrimary}
        size={28}
        style={styles.fab}
        onPress={() => router.push('/(fpo)/farmer-register' as any)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', marginLeft: Spacing.xs },
  searchContainer: { padding: Spacing.xl },
  searchBar: { borderRadius: BorderRadius.md, elevation: 0, borderWidth: 1.5, borderColor: '#E5E7EB' },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  infoCol: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: '700' },
  subText: { fontSize: FontSize.xs, marginTop: 2 },
  depositCol: { alignItems: 'flex-end' },
  depositLabel: { fontSize: 9, marginBottom: 2 },
  depositVal: { fontSize: FontSize.sm, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['5xl'] },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.md, fontWeight: '600' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, borderRadius: 16 },
});
