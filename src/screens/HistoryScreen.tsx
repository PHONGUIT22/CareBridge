import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { LogRepo, DailyLogItem } from '../database/logRepo';
import { MedicineRepo, MedicineRecord } from '../database/medicineRepo';
import { MedicationPunchCard } from '../components/MedicationPunchCard';
import { Feather, Ionicons } from '@expo/vector-icons';
import { RewardedAdModal } from '../components/RewardedAdModal';
import { PdfService } from '../services/pdfService';
import { SponsoredHealthBanner } from '../components/SponsoredHealthBanner';

const CARD_PALETTES = [
  '#EA580C', // Orange
  '#7C3AED', // Purple
  '#059669', // Emerald green
  '#0284C7', // Ocean blue
  '#D97706', // Warm amber
  '#1E3A8A', // Navy
];

export const HistoryScreen: React.FC = () => {
  const [logs, setLogs] = useState<DailyLogItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdVisible, setIsAdVisible] = useState(false);

  const loadData = useCallback(async () => {
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteMedication = (id: string, name: string) => {
    Alert.alert(
      'Delete Punch-Card',
      `Are you sure you want to permanently delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await MedicineRepo.deleteMedicine(id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleExportPDF = () => {
    setIsAdVisible(true); // Display rewarded ad on Export action
  };

  const executeRealExport = async () => {
    try {
      const [allLogs, allMeds] = await Promise.all([
        LogRepo.getAllLogs(),
        MedicineRepo.getAllMedicines(),
      ]);
      await PdfService.generateDoctorReport(allLogs, allMeds);
    } catch (err) {
      Alert.alert('Error', 'Could not generate PDF report.');
    }
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
        {loading && medicines.length === 0 ? (
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
              <View key={med.id} style={styles.cardWrapper}>
                <MedicationPunchCard
                  medicineName={med.name}
                  dosage={med.dosage}
                  time={primaryTime}
                  createdAt={med.createdAt}
                  themeColor={color}
                  logs={logs}
                  onToggleToday={async () => {
                    const freshLogs = await LogRepo.getAllLogs();
                    setLogs(freshLogs);
                  }}
                />

                <TouchableOpacity
                  style={styles.deleteBadgeBtn}
                  onPress={() => handleDeleteMedication(med.id, med.name)}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* SPONSORED HEALTH BANNER (RevenueCat Catvertising) */}
        <SponsoredHealthBanner placement="history_footer" />
      </ScrollView>

      {/* 3. REWARDED AD MODAL */}
      <RewardedAdModal
        visible={isAdVisible}
        placement="export_pdf"
        onClose={() => setIsAdVisible(false)}
        onAdCompleted={executeRealExport}
      />
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
  cardWrapper: {
    position: 'relative',
  },
  deleteBadgeBtn: {
    position: 'absolute',
    top: 14,
    right: 58,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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