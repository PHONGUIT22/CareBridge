import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { THEME } from '../constants/theme';
import { VitalsRepo, VitalsRecord } from '../database/vitalsRepo';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';

export interface RecordVitalsModalProps {
  visible: boolean;
  dateStr: string;
  onClose: () => void;
  onSaved?: () => void;
}

export const RecordVitalsModal: React.FC<RecordVitalsModalProps> = ({
  visible,
  dateStr,
  onClose,
  onSaved,
}) => {
  const { showAlert } = useAlert();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [sugar, setSugar] = useState('');
  const [hr, setHr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVitals();
    }
  }, [visible, dateStr]);

  const loadVitals = async () => {
    const data = await VitalsRepo.getVitalsByDate(dateStr);
    if (data) {
      setSystolic(data.systolic ? String(data.systolic) : '');
      setDiastolic(data.diastolic ? String(data.diastolic) : '');
      setSugar(data.bloodSugar ? String(data.bloodSugar) : '');
      setHr(data.heartRate ? String(data.heartRate) : '');
    } else {
      setSystolic('');
      setDiastolic('');
      setSugar('');
      setHr('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await VitalsRepo.saveVitals({
        date: dateStr,
        systolic: systolic ? parseInt(systolic, 10) : null,
        diastolic: diastolic ? parseInt(diastolic, 10) : null,
        bloodSugar: sugar ? parseFloat(sugar) : null,
        heartRate: hr ? parseInt(hr, 10) : null,
        updatedAt: new Date().toISOString(),
      });
      onClose();
      if (onSaved) {
        onSaved();
      }
      showAlert({
        title: 'Vitals Logged',
        message: 'Daily vital metrics updated successfully.',
        type: 'success',
      });
    } catch (err) {
      console.error('Error saving vitals:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderTitleGroup}>
              <Text style={styles.modalTitle}>Record Daily Vitals</Text>
              <Text style={styles.modalDateSubtitle}>{dateStr}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.modalCloseBtn}
            >
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Blood Pressure (Systolic / Diastolic)</Text>
          <View style={styles.dualInputRow}>
            <TextInput
              style={[styles.inputBox, { flex: 1 }]}
              placeholder="120"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={systolic}
              onChangeText={setSystolic}
            />
            <Text style={{ fontSize: 18, color: '#94A3B8', fontWeight: '700' }}>/</Text>
            <TextInput
              style={[styles.inputBox, { flex: 1 }]}
              placeholder="80"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={diastolic}
              onChangeText={setDiastolic}
            />
          </View>

          <Text style={styles.inputLabel}>Blood Sugar (mg/dL)</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="e.g. 95 or 110"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={sugar}
            onChangeText={setSugar}
          />

          <Text style={styles.inputLabel}>Heart Rate (BPM)</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="e.g. 72"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={hr}
            onChangeText={setHr}
          />

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Vitals'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export interface QuickVitalsBarProps {
  dateStr: string;
}

export const QuickVitalsBar: React.FC<QuickVitalsBarProps> = ({ dateStr }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [vitals, setVitals] = useState<VitalsRecord | null>(null);

  const loadVitals = async () => {
    const data = await VitalsRepo.getVitalsByDate(dateStr);
    setVitals(data);
  };

  useEffect(() => {
    loadVitals();
  }, [dateStr]);

  const bpText = vitals?.systolic && vitals?.diastolic ? `${vitals.systolic}/${vitals.diastolic}` : '--/--';
  const sugarText = vitals?.bloodSugar ? `${vitals.bloodSugar}` : '--';
  const hrText = vitals?.heartRate ? `${vitals.heartRate}` : '--';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>DAILY VITALS & BIOMETRICS</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.updateLink}>+ Log Vitals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vitalsRow}>
        <TouchableOpacity style={styles.vitalCard} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="heart-pulse" size={20} color="#DC2626" />
          <Text style={styles.vitalValue}>{bpText}</Text>
          <Text style={styles.vitalUnit}>BP (mmHg)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.vitalCard} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="water-percent" size={20} color="#0284C7" />
          <Text style={styles.vitalValue}>{sugarText}</Text>
          <Text style={styles.vitalUnit}>Sugar (mg/dL)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.vitalCard} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Feather name="activity" size={18} color="#16A34A" />
          <Text style={styles.vitalValue}>{hrText}</Text>
          <Text style={styles.vitalUnit}>Heart (bpm)</Text>
        </TouchableOpacity>
      </View>

      <RecordVitalsModal
        visible={modalVisible}
        dateStr={dateStr}
        onClose={() => setModalVisible(false)}
        onSaved={loadVitals}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 20, marginVertical: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: THEME.colors.royalBlue, letterSpacing: 1.2 },
  updateLink: { fontSize: 12, fontWeight: '700', color: THEME.colors.primary },
  vitalsRow: { flexDirection: 'row', gap: 10 },
  vitalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...THEME.shadows.card,
  },
  vitalValue: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 4 },
  vitalUnit: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, width: '100%', maxWidth: 360, ...THEME.shadows.card },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalHeaderTitleGroup: { flex: 1 },
  modalTitle: { fontSize: 19, fontWeight: '900', color: '#0F172A' },
  modalDateSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 12, marginBottom: 5 },
  inputBox: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 12, height: 46, fontSize: 15, fontWeight: '700', color: '#0F172A', backgroundColor: '#F8FAFC' },
  dualInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  saveBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
