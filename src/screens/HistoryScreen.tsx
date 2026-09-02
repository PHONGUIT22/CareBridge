import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { THEME } from '../constants/theme';
import { LogRepo, DailyLogItem } from '../database/logRepo';
import { MedicineRepo, MedicineRecord } from '../database/medicineRepo';
import { MedicationPunchCard } from '../components/MedicationPunchCard';
import { Feather, Ionicons } from '@expo/vector-icons';

// Bảng màu rực rỡ phong cách HabitBox cho từng loại thuốc
const CARD_PALETTES = [
  '#EA580C', // Cam rực (như Morning Exercise trong ảnh mẫu)
  '#7C3AED', // Tím đậm (như Meditation trong ảnh mẫu)
  '#059669', // Xanh ngọc lục bảo (như Reading)
  '#0284C7', // Xanh dương biển (như Drink Water)
  '#D97706', // Vàng cam ấm (như Guitar Practice)
  '#1E3A8A', // Xanh Navy y tế
];

export const HistoryScreen: React.FC = () => {
  const [logs, setLogs] = useState<DailyLogItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [allLogs, allMeds] = await Promise.all([
        LogRepo.getAllLogs(),
        MedicineRepo.getAllMedicines(),
      ]);
      setLogs(allLogs);
      setMedicines(allMeds);
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportPDF = () => {
    Alert.alert(
      'Clinical Report Export',
      'HabitBox Punch-card compliance history has been prepared for doctor review.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. TOP HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>HABITBOX COMPLIANCE MATRIX</Text>
          <Text style={styles.headerTitle}>Medication History</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF} activeOpacity={0.8}>
          <Feather name="download" size={18} color={THEME.colors.textWhite} />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* 2. SCROLLABLE PUNCH-CARD LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading punch-card matrix...</Text>
          </View>
        ) : medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={60} color={THEME.light.border} />
            <Text style={styles.emptyTitle}>No Prescription Punch-Cards</Text>
            <Text style={styles.emptySubtitle}>
              Add medications on the "Today" tab to start tracking your punch-card streaks!
            </Text>
          </View>
        ) : (
          medicines.map((med, index) => {
            const color = CARD_PALETTES[index % CARD_PALETTES.length];
            const primaryTime = med.reminderTimes[0] || '08:00';

            return (
              <MedicationPunchCard
                key={med.id}
                medicineName={med.name}
                dosage={med.dosage}
                time={primaryTime}
                themeColor={color}
                logs={logs}
                onToggleToday={async () => {
                  await fetchHistory();
                }}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.light.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.light.borderLight,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.royalBlue,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: THEME.fontSizes.xl,
    fontWeight: '900',
    color: THEME.light.textPrimary,
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...THEME.shadows.card,
  },
  exportBtnText: {
    color: THEME.colors.textWhite,
    fontSize: THEME.fontSizes.sm,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '600',
    color: THEME.light.textMuted,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
  },
  emptyTitle: {
    fontSize: THEME.fontSizes.lg,
    fontWeight: '800',
    color: THEME.light.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '500',
    color: THEME.light.textMuted,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});