import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { CalendarStrip } from '../components/CalendarStrip';
import { MedicineCard } from '../components/MedicineCard';
import { useMedicines } from '../hooks/useMedicines';
import { MedicineRepo } from '../database/medicineRepo';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const PRESET_MEDICINES = [
  { name: 'Blood Pressure', icon: 'heart-pulse', defaultDose: '1 Tablet' },
  { name: 'Advil / Pain', icon: 'pill', defaultDose: '200 mg' },
  { name: 'Diabetes / Sugar', icon: 'water-percent', defaultDose: '500 mg' },
  { name: 'Aspirin (Heart)', icon: 'heart', defaultDose: '81 mg' },
  { name: 'Vitamin / Multi', icon: 'fruit-cherries', defaultDose: '1 Pill' },
  { name: 'Eye Drops', icon: 'eye-outline', defaultDose: '2 Drops' },
  { name: 'panadol', icon: 'pill', defaultDose: '500 mg' },
  { name: 'Calcium / Bones', icon: 'bone', defaultDose: '600 mg' },
];

const PRESET_DOSES = ['1 Tablet', '200 mg', '500 mg', '1 Pill', '2 Drops', '1 Spoon'];
const PRESET_TIMES = ['08:00', '12:00', '18:00', '21:00'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const MedicineManagerScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { timeGroups, loading, refresh, handleToggleTake } = useMedicines(selectedDate);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null); // null = Thêm mới, có ID = Chế độ Sửa/Xóa
  const [selectedMedName, setSelectedMedName] = useState(PRESET_MEDICINES[0].name);
  const [selectedDose, setSelectedDose] = useState('1 Tablet');
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['ALL']);

  const formattedDayTitle = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const openAddModal = () => {
    setEditingMedId(null);
    setSelectedMedName(PRESET_MEDICINES[0].name);
    setSelectedDose('1 Tablet');
    setSelectedTime('08:00');
    setSelectedDays(['ALL']);
    setIsModalVisible(true);
  };

  const openEditModal = (medicineId: string, name: string, dosage: string, time: string) => {
    setEditingMedId(medicineId);
    setSelectedMedName(name);
    setSelectedDose(dosage);
    setSelectedTime(time);
    setSelectedDays(['ALL']);
    setIsModalVisible(true);
  };

  const toggleDay = (day: string) => {
    if (day === 'ALL') {
      setSelectedDays(['ALL']);
      return;
    }
    let newDays = selectedDays.filter((d) => d !== 'ALL');
    if (newDays.includes(day)) {
      newDays = newDays.filter((d) => d !== day);
      if (newDays.length === 0) newDays = ['ALL'];
    } else {
      newDays.push(day);
    }
    setSelectedDays(newDays);
  };

  // 1. LƯU HOẶC CẬP NHẬT
  const handleSaveMedicine = async () => {
    try {
      if (editingMedId) {
        // Cập nhật thuốc cũ
        await MedicineRepo.updateMedicine(editingMedId, {
          name: selectedMedName,
          dosage: selectedDose,
          reminderTimes: [selectedTime],
          daysOfWeek: selectedDays,
        });
        Alert.alert('Updated', `Prescription "${selectedMedName}" updated!`);
      } else {
        // Thêm thuốc mới
        await MedicineRepo.addMedicine({
          name: selectedMedName,
          dosage: selectedDose,
          reminderTimes: [selectedTime],
          daysOfWeek: selectedDays,
        });
        Alert.alert('Prescription Saved', `Added ${selectedMedName} at ${selectedTime}`);
      }

      setIsModalVisible(false);
      await refresh();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save medication');
    }
  };

  // 2. XÓA ĐƠN THUỐC
  const handleDeleteMedicine = () => {
    if (!editingMedId) return;

    Alert.alert(
      'Delete Prescription',
      `Are you sure you want to permanently delete "${selectedMedName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MedicineRepo.deleteMedicine(editingMedId);
              setIsModalVisible(false);
              await refresh();
              Alert.alert('Deleted', `"${selectedMedName}" has been removed.`);
            } catch (err) {
              Alert.alert('Error', 'Could not delete medication.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.subGreeting}>DAILY SCHEDULE</Text>
          <Text style={styles.mainDateText} numberOfLines={1}>
            {formattedDayTitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color={THEME.colors.textWhite} />
        </TouchableOpacity>
      </View>

      {/* 2. CALENDAR STRIP */}
      <View style={styles.calendarContainer}>
        <CalendarStrip
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
        />
      </View>

      {/* 3. MEDICINE LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading prescriptions...</Text>
          </View>
        ) : timeGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color={THEME.light.border} />
            <Text style={styles.emptyTitle}>No Medications Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Tap the button below to choose your medication with 1 tap.
            </Text>
          </View>
        ) : (
          timeGroups.map((group) => (
            <View key={group.time} style={styles.timeSection}>
              <View style={styles.timeSectionHeader}>
                <Feather name="clock" size={18} color={THEME.colors.primary} />
                <Text style={styles.timeSectionTitle}>{group.time}</Text>
              </View>

              {group.items.map((item) => (
                <MedicineCard
                  key={item.logId}
                  name={item.name}
                  dosage={item.dosage}
                  intakeCount={1}
                  isTaken={item.isTaken}
                  takenAt={item.takenAt}
                  onToggleTake={() => handleToggleTake(item.logId, item.status)}
                  // BẤM VÀO ĐỂ SỬA / XÓA
                  onPressCard={() =>
                    openEditModal(item.medicineId, item.name, item.dosage, item.scheduledTime)
                  }
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* 4. FLOATING ACTION BUTTON */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingActionButton}
          onPress={openAddModal}
          activeOpacity={0.85}
        >
          <Feather name="plus-circle" size={24} color={THEME.colors.textWhite} style={{ marginRight: 8 }} />
          <Text style={styles.floatingButtonText}>Add Medication</Text>
        </TouchableOpacity>
      </View>

      {/* 5. MODAL THÊM / SỬA / XÓA */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMedId ? 'Edit Prescription' : 'New Prescription'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Feather name="x" size={26} color={THEME.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Step 1: Chọn tên thuốc */}
              <Text style={styles.sectionLabel}>1. SELECT MEDICINE</Text>
              <View style={styles.medGrid}>
                {PRESET_MEDICINES.map((med) => {
                  const isSelected = selectedMedName.toLowerCase() === med.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={med.name}
                      style={[styles.medChip, isSelected && styles.medChipSelected]}
                      onPress={() => {
                        setSelectedMedName(med.name);
                        setSelectedDose(med.defaultDose);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={med.icon as any}
                        size={22}
                        color={isSelected ? THEME.colors.textWhite : THEME.colors.primary}
                      />
                      <Text style={[styles.medChipText, isSelected && styles.medChipTextSelected]}>
                        {med.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 2: Chọn liều lượng */}
              <Text style={styles.sectionLabel}>2. SELECT DOSE</Text>
              <View style={styles.chipsRow}>
                {PRESET_DOSES.map((dose) => {
                  const isSelected = selectedDose === dose;
                  return (
                    <TouchableOpacity
                      key={dose}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setSelectedDose(dose)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {dose}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 3: Chọn giờ uống */}
              <Text style={styles.sectionLabel}>3. TIME TO TAKE</Text>
              <View style={styles.chipsRow}>
                {PRESET_TIMES.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 4: Tần suất */}
              <Text style={styles.sectionLabel}>4. FREQUENCY</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, selectedDays.includes('ALL') && styles.chipSelected]}
                  onPress={() => toggleDay('ALL')}
                >
                  <Text style={[styles.chipText, selectedDays.includes('ALL') && styles.chipTextSelected]}>
                    Everyday
                  </Text>
                </TouchableOpacity>

                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chipMini, selectedDays.includes(d) && styles.chipSelected]}
                    onPress={() => toggleDay(d)}
                  >
                    <Text style={[styles.chipText, selectedDays.includes(d) && styles.chipTextSelected]}>
                      {d[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* NÚT LƯU HOẶC CẬP NHẬT */}
              <TouchableOpacity
                style={styles.saveCta}
                onPress={handleSaveMedicine}
                activeOpacity={0.85}
              >
                <Text style={styles.saveCtaText}>
                  {editingMedId ? 'Update Prescription' : 'Save Medication'}
                </Text>
              </TouchableOpacity>

              {/* NÚT XÓA ĐỎ NỔI BẬT (CHỈ HIỆN KHI Ở CHẾ ĐỘ SỬA) */}
              {editingMedId && (
                <TouchableOpacity
                  style={styles.deleteCta}
                  onPress={handleDeleteMedicine}
                  activeOpacity={0.85}
                >
                  <Feather name="trash-2" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteCtaText}>Delete Prescription</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.light.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  subGreeting: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '800',
    color: THEME.colors.royalBlue,
    letterSpacing: 1.5,
  },
  mainDateText: {
    fontSize: THEME.fontSizes.xl,
    fontWeight: '900',
    color: THEME.light.textPrimary,
    marginTop: 2,
  },
  headerAddButton: {
    backgroundColor: THEME.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.card,
  },
  calendarContainer: {
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingVertical: 60,
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
  timeSection: {
    marginBottom: 18,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingLeft: 4,
  },
  timeSectionTitle: {
    fontSize: THEME.fontSizes.lg,
    fontWeight: '800',
    color: THEME.light.textPrimary,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingActionButton: {
    backgroundColor: THEME.colors.primary,
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: THEME.fontSizes.md,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.light.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: THEME.fontSizes.xl,
    fontWeight: '900',
    color: THEME.light.textPrimary,
  },
  sectionLabel: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '800',
    color: THEME.colors.royalBlue,
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 10,
  },
  medGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  medChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.light.border,
    width: '48%',
  },
  medChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  medChipText: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '700',
    color: THEME.light.textPrimary,
    flex: 1,
  },
  medChipTextSelected: {
    color: THEME.colors.textWhite,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: THEME.light.background,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.light.border,
  },
  chipMini: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.light.border,
    backgroundColor: THEME.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '700',
    color: THEME.light.textSecondary,
  },
  chipTextSelected: {
    color: THEME.colors.textWhite,
  },
  saveCta: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveCtaText: {
    color: THEME.colors.textWhite,
    fontSize: THEME.fontSizes.md,
    fontWeight: '800',
  },
  deleteCta: {
    backgroundColor: THEME.colors.statusSkipped, // Màu đỏ xóa
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  deleteCtaText: {
    color: '#FFFFFF',
    fontSize: THEME.fontSizes.md,
    fontWeight: '800',
  },
});