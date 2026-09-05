import React, { useState, useCallback, useEffect } from 'react';
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
  useWindowDimensions,
  Image,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { CalendarStrip } from '../components/CalendarStrip';
import { MedicineCard } from '../components/MedicineCard';
import { SeniorClock } from '../components/SeniorClock';
import { QuickVitalsBar } from '../components/QuickVitalsBar';
import { useMedicines } from '../hooks/useMedicines';
import { MedicineRepo } from '../database/medicineRepo';
import { CaregiverRepo, CaregiverProfile } from '../database/caregiverRepo';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SubscriptionService } from '../services/revenuecat';
import { AdService } from '../services/admobService';
import { formatToISODate } from '../utils/dateUtils';

const PRESET_MEDICINES = [
  { name: 'Blood Pressure', icon: 'heart-pulse', defaultDose: '1 Tablet' },
  { name: 'Advil / Pain', icon: 'pill', defaultDose: '200 mg' },
  { name: 'Diabetes / Sugar', icon: 'water-percent', defaultDose: '500 mg' },
  { name: 'Aspirin (Heart)', icon: 'heart', defaultDose: '81 mg' },
  { name: 'Vitamin / Multi', icon: 'fruit-cherries', defaultDose: '1 Pill' },
  { name: 'Eye Drops', icon: 'eye-outline', defaultDose: '2 Drops' },
  { name: 'Panadol', icon: 'pill', defaultDose: '500 mg' },
  { name: 'Calcium / Bones', icon: 'bone', defaultDose: '600 mg' },
];

// Presets for health and care routines
const PRESET_ROUTINES = [
  { name: 'Blood Pressure Check', icon: 'heart-pulse', defaultDose: '1 Reading', type: 'routine' },
  { name: 'Drink Warm Water', icon: 'cup-water', defaultDose: '250 ml', type: 'routine' },
  { name: 'Morning Walk', icon: 'walk', defaultDose: '15 Mins', type: 'routine' },
  { name: 'Blood Glucose Test', icon: 'water-percent', defaultDose: '1 Strip', type: 'routine' },
];

const PRESET_DOSES = ['1 Tablet', '200 mg', '500 mg', '1 Pill', '2 Drops', '1 Spoon'];
const PRESET_ROUTINE_DOSES = ['1 Reading', '250 ml', '15 Mins', '30 Mins', '1 Strip', '1 Session'];
const PRESET_TIMES = ['08:00', '12:00', '18:00', '21:00'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const MedicineManagerScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { timeGroups, loading, refresh, handleToggleTake } = useMedicines(selectedDate);

  const todayStr = formatToISODate(new Date());
  const selectedDateStr = formatToISODate(selectedDate);
  const isFutureDate = selectedDateStr > todayStr;

  const { width } = useWindowDimensions();
  const isUnfoldedFold = width >= 600; // Large screen or unfolded Z Fold

  const onToggleTakeWithHaptic = (logId: string, status: any) => {
    // Physical haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    handleToggleTake(logId, status);
  };

  // Subscription State
  const [isPro, setIsPro] = useState(false);
  const [medsCount, setMedsCount] = useState(0);

  // Caregiver Profile State (synced from local SQLite)
  const [caregiver, setCaregiver] = useState<CaregiverProfile>(() => CaregiverRepo.getCaregiverSync());

  useEffect(() => {
    CaregiverRepo.getCaregiver().then((c) => setCaregiver(c));
    const unsubscribe = CaregiverRepo.subscribe((updated) => setCaregiver(updated));
    return unsubscribe;
  }, []);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'medication' | 'routine'>('medication');
  const [selectedMedName, setSelectedMedName] = useState(PRESET_MEDICINES[0].name);
  const [selectedDose, setSelectedDose] = useState('1 Tablet');
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['ALL']);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSelectType = (type: 'medication' | 'routine') => {
    setSelectedType(type);
    if (!editingMedId) {
      if (type === 'medication') {
        setSelectedMedName(PRESET_MEDICINES[0].name);
        setSelectedDose(PRESET_MEDICINES[0].defaultDose);
      } else {
        setSelectedMedName(PRESET_ROUTINES[0].name);
        setSelectedDose(PRESET_ROUTINES[0].defaultDose);
      }
    }
  };

  const updateSubscriptionState = useCallback(async () => {
    const proStatus = await SubscriptionService.isPro();
    const allMeds = await MedicineRepo.getAllMedicines();
    setIsPro(proStatus);
    setMedsCount(allMeds.length);
  }, []);

  // Automatically sync Pro status and refresh medication list on tab focus
  useFocusEffect(
    useCallback(() => {
      async function syncData() {
        // Automatically sync back to today if waking up on a new day
        const realTodayStr = formatToISODate(new Date());
        if (formatToISODate(selectedDate) !== realTodayStr && selectedDateStr < realTodayStr) {
          setSelectedDate(new Date());
        }

        const proStatus = await SubscriptionService.isPro();
        const allMeds = await MedicineRepo.getAllMedicines();
        const caregiverProfile = await CaregiverRepo.getCaregiver();
        setIsPro(proStatus);
        setMedsCount(allMeds.length);
        setCaregiver(caregiverProfile);
        await refresh(); // <-- Automatically refresh medication list on tab focus
      }
      syncData();
    }, [refresh, selectedDate, selectedDateStr])
  );

  const formattedDayTitle = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const openAddModal = () => {
    showAddFormAfterAd();
  };

  const handleRefillPress = (medicineId: string, name: string) => {
    AdService.showRewardedAd('refill_stock', async () => {
      await MedicineRepo.refillMedicine(medicineId, 30);
      await refresh();
      Alert.alert('Refilled!', `Successfully added 30 pills for "${name}".`);
    });
  };

  const showAddFormAfterAd = () => {
    setEditingMedId(null);
    setSelectedType('medication');
    setSelectedMedName(PRESET_MEDICINES[0].name);
    setSelectedDose('1 Tablet');
    setSelectedTime('08:00');
    setSelectedDays(['ALL']);
    setSelectedImage(null);
    setIsModalVisible(true);
  };

  const openEditModal = (
    medicineId: string,
    name: string,
    dosage: string,
    time: string,
    imageUri?: string,
    type?: 'medication' | 'routine'
  ) => {
    setEditingMedId(medicineId);
    setSelectedType(type || 'medication');
    setSelectedMedName(name);
    setSelectedDose(dosage);
    setSelectedTime(time);
    setSelectedDays(['ALL']);
    setSelectedImage(imageUri || null);
    setIsModalVisible(true);
  };

  const handlePickImage = () => {
    Alert.alert(
      'Pill Photo (Visual ID)',
      'Take a photo of your actual pill so seniors can identify it easily.',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Camera access is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.6,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.6,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  const handleSaveMedicine = async () => {
    if (!selectedMedName.trim()) {
      Alert.alert('Missing Name', 'Please enter or select a medication name.');
      return;
    }
    if (!selectedDose.trim()) {
      Alert.alert('Missing Dosage', 'Please enter or select a dosage.');
      return;
    }

    // Automatically normalize time format if user misses leading zero or minutes
    let formattedTime = selectedTime.trim();
    if (!formattedTime.includes(':')) {
      formattedTime = `${formattedTime}:00`;
    }

    try {
      if (editingMedId) {
        await MedicineRepo.updateMedicine(editingMedId, {
          name: selectedMedName.trim(),
          dosage: selectedDose.trim(),
          reminderTimes: [formattedTime],
          daysOfWeek: selectedDays,
          imageUri: selectedImage,
          type: selectedType,
        });
        Alert.alert(
          'Updated',
          `${selectedType === 'routine' ? 'Care Routine' : 'Prescription'} "${selectedMedName}" updated!`
        );
      } else {
        await MedicineRepo.addMedicine({
          name: selectedMedName.trim(),
          dosage: selectedDose.trim(),
          reminderTimes: [formattedTime],
          daysOfWeek: selectedDays,
          imageUri: selectedImage,
          type: selectedType,
        });
        Alert.alert(
          `${selectedType === 'routine' ? 'Routine Saved' : 'Prescription Saved'}`,
          `Added ${selectedMedName} at ${formattedTime}`
        );
      }
      setIsModalVisible(false);
      await updateSubscriptionState();
      await refresh();
    } catch (error) {
      Alert.alert('Error', 'Could not save item');
    }
  };

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
            await MedicineRepo.deleteMedicine(editingMedId);
            setIsModalVisible(false);
            await updateSubscriptionState();
            await refresh();
            Alert.alert('Deleted', `"${selectedMedName}" has been removed.`);
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
          <View style={styles.headerGreetingRow}>
            <Text style={styles.subGreeting}>DAILY SCHEDULE</Text>
            <View style={styles.caregiverBadge}>
              <Feather name="user-check" size={10} color={THEME.colors.royalBlue} />
              <Text style={styles.caregiverBadgeText} numberOfLines={1}>
                Caregiver: {caregiver.name}
              </Text>
            </View>
          </View>
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

      {/* 3. QUICK VITALS BAR (PAWBLOOM DESIGN PATTERN) */}
      <QuickVitalsBar dateStr={selectedDateStr} />

      {/* TWO-COLUMN LAYOUT FOR UNFOLDED Z FOLD / SINGLE COLUMN FOR STANDARD PHONE */}
      <View style={[styles.mainLayoutWrapper, isUnfoldedFold && styles.twoColumnLayout]}>
        {/* LEFT COLUMN: MEDICATION LIST */}
        <View style={isUnfoldedFold ? styles.columnLeft : { flex: 1 }}>
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
                      imageUri={item.imageUri}
                      stockCount={item.stockCount}
                      type={item.type}
                      onRefill={() => handleRefillPress(item.medicineId, item.name)}
                      intakeCount={1}
                      isTaken={item.isTaken}
                      isFuture={isFutureDate}
                      takenAt={item.takenAt}
                      onToggleTake={() => {
                        if (isFutureDate) {
                          Alert.alert('Notice', 'Cannot take future medications in advance.');
                          return;
                        }
                        onToggleTakeWithHaptic(item.logId, item.status);
                      }}
                      onPressCard={() =>
                        openEditModal(
                          item.medicineId,
                          item.name,
                          item.dosage,
                          item.scheduledTime,
                          item.imageUri,
                          item.type
                        )
                      }
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* RIGHT COLUMN (SHOWN WHEN EXPANDED ON GALAXY Z FOLD) */}
        {isUnfoldedFold && (
          <View style={styles.columnRight}>
            <View style={styles.foldClockCard}>
              <Text style={styles.foldClockBadge}>GALAXY Z FOLD EXPANDED VIEW</Text>
              <SeniorClock dark={false} />
            </View>
          </View>
        )}
      </View>

      {/* 5. ADD / EDIT PRESCRIPTION MODAL */}
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
                {editingMedId
                  ? selectedType === 'routine'
                    ? 'Edit Care Routine'
                    : 'Edit Prescription'
                  : selectedType === 'routine'
                  ? 'New Care Routine'
                  : 'New Prescription'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Feather name="x" size={26} color={THEME.light.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 2-TAB TYPE SELECTOR */}
            <View style={styles.typeTabRow}>
              <TouchableOpacity
                style={[styles.typeTab, selectedType === 'medication' && styles.typeTabActive]}
                onPress={() => handleSelectType('medication')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="pill"
                  size={18}
                  color={selectedType === 'medication' ? '#FFFFFF' : THEME.colors.primary}
                />
                <Text
                  style={[styles.typeTabText, selectedType === 'medication' && styles.typeTabTextActive]}
                >
                  Prescription
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeTab, selectedType === 'routine' && styles.typeTabActive]}
                onPress={() => handleSelectType('routine')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={18}
                  color={selectedType === 'routine' ? '#FFFFFF' : THEME.colors.primary}
                />
                <Text
                  style={[styles.typeTabText, selectedType === 'routine' && styles.typeTabTextActive]}
                >
                  Care Routine
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1. MEDICINE NAME & QUICK PRESETS */}
              <Text style={styles.sectionLabel}>
                {selectedType === 'routine' ? '1. ROUTINE / ACTIVITY NAME' : '1. MEDICINE NAME'}
              </Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name={selectedType === 'routine' ? 'activity' : 'edit-3'}
                  size={18}
                  color={THEME.colors.primary}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={styles.customTextInput}
                  placeholder={
                    selectedType === 'routine'
                      ? 'e.g. Blood Pressure Check, Morning Walk...'
                      : 'e.g. Amlodipine, Panadol...'
                  }
                  placeholderTextColor={THEME.light.textMuted}
                  value={selectedMedName}
                  onChangeText={setSelectedMedName}
                />
                {selectedMedName.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedMedName('')}>
                    <Feather name="x-circle" size={18} color={THEME.light.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.subLabel}>
                {selectedType === 'routine' ? 'Or choose routine template:' : 'Or choose quick suggestion:'}
              </Text>
              <View style={styles.medGrid}>
                {(selectedType === 'routine' ? PRESET_ROUTINES : PRESET_MEDICINES).map((item) => {
                  const isSelected = selectedMedName.toLowerCase() === item.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.medChip, isSelected && styles.medChipSelected]}
                      onPress={() => {
                        setSelectedMedName(item.name);
                        setSelectedDose(item.defaultDose);
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={20}
                        color={isSelected ? THEME.colors.textWhite : THEME.colors.primary}
                      />
                      <Text style={[styles.medChipText, isSelected && styles.medChipTextSelected]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. DOSAGE / AMOUNT */}
              <Text style={styles.sectionLabel}>
                {selectedType === 'routine' ? '2. TARGET / DURATION' : '2. DOSAGE / STRENGTH'}
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name={selectedType === 'routine' ? 'target' : 'pill'}
                  size={18}
                  color={THEME.colors.primary}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={styles.customTextInput}
                  placeholder={
                    selectedType === 'routine'
                      ? 'e.g. 1 Reading, 250 ml, 15 Mins...'
                      : 'e.g. 1 Tablet, 500 mg, 10 ml...'
                  }
                  placeholderTextColor={THEME.light.textMuted}
                  value={selectedDose}
                  onChangeText={setSelectedDose}
                />
              </View>

              <View style={styles.chipsRow}>
                {(selectedType === 'routine' ? PRESET_ROUTINE_DOSES : PRESET_DOSES).map((dose) => {
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

              {/* PILL PHOTO (ONLY FOR PRESCRIPTION) */}
              {selectedType === 'medication' && (
                <>
                  <Text style={styles.sectionLabel}>PILL PHOTO (FOR VISUAL RECOGNITION)</Text>
                  <View style={styles.photoPickerRow}>
                    <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickImage} activeOpacity={0.8}>
                      {selectedImage ? (
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                      ) : (
                        <View style={styles.placeholderBox}>
                          <Feather name="camera" size={26} color={THEME.colors.primary} />
                          <Text style={styles.photoPickerText}>Snap Real Pill</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {selectedImage && (
                      <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setSelectedImage(null)}>
                        <Feather name="trash-2" size={16} color={THEME.colors.statusSkipped} />
                        <Text style={styles.removePhotoText}>Remove Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {/* 3. TIME TO TAKE */}
              <Text style={styles.sectionLabel}>3. TIME TO TAKE (24H FORMAT)</Text>
              <View style={styles.inputWrapper}>
                <Feather name="clock" size={18} color={THEME.colors.primary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.customTextInput}
                  placeholder="e.g. 08:00, 14:30, 20:00"
                  placeholderTextColor={THEME.light.textMuted}
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                />
              </View>

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

              {/* 4. FREQUENCY */}
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

              <TouchableOpacity
                style={styles.saveCta}
                onPress={handleSaveMedicine}
                activeOpacity={0.85}
              >
                <Text style={styles.saveCtaText}>
                  {editingMedId
                    ? selectedType === 'routine'
                      ? 'Update Care Routine'
                      : 'Update Prescription'
                    : selectedType === 'routine'
                    ? 'Save Care Routine'
                    : 'Save Medication'}
                </Text>
              </TouchableOpacity>

              {editingMedId && (
                <TouchableOpacity
                  style={styles.deleteCta}
                  onPress={handleDeleteMedicine}
                  activeOpacity={0.85}
                >
                  <Feather name="trash-2" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteCtaText}>
                    {selectedType === 'routine' ? 'Delete Care Routine' : 'Delete Prescription'}
                  </Text>
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
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  headerGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  caregiverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  caregiverBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.royalBlue,
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
    paddingBottom: 40,
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: THEME.fontSizes.xl,
    fontWeight: '900',
    color: THEME.light.textPrimary,
  },
  typeTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 14,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeTabActive: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.card,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  typeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    backgroundColor: THEME.colors.statusSkipped,
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
  mainLayoutWrapper: { flex: 1 },
  twoColumnLayout: { flexDirection: 'row', paddingHorizontal: 12 },
  columnLeft: { flex: 1.1, paddingRight: 10 },
  columnRight: { flex: 0.9, paddingLeft: 10, justifyContent: 'center' },
  foldClockCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  foldClockBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.royalBlue,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  photoPickerBtn: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginTop: 4,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.statusSkipped,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: THEME.light.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
  },
  customTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.light.textPrimary,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.light.textMuted,
    marginBottom: 8,
  },
});