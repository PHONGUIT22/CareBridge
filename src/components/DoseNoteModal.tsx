import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';

export interface DoseNoteModalProps {
  visible: boolean;
  medName: string;
  scheduledTime: string;
  currentNotes?: string;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
}

export type SeverityType = 'positive' | 'warning' | 'alert';

export interface QuickTagItem {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  severity: SeverityType;
  bg: string;
  selectedBg: string;
  borderColor: string;
  selectedBorderColor: string;
  textColor: string;
}

const QUICK_TAGS: QuickTagItem[] = [
  {
    label: 'Taken with meal',
    icon: 'food-apple-outline',
    severity: 'positive',
    bg: '#F0FDF4',
    selectedBg: '#DCFCE7',
    borderColor: '#BBF7D0',
    selectedBorderColor: '#86EFAC',
    textColor: '#166534',
  },
  {
    label: 'Normal / No side effects',
    icon: 'check-circle-outline',
    severity: 'positive',
    bg: '#F0FDF4',
    selectedBg: '#DCFCE7',
    borderColor: '#BBF7D0',
    selectedBorderColor: '#86EFAC',
    textColor: '#166534',
  },
  {
    label: 'Empty stomach',
    icon: 'water-outline',
    severity: 'warning',
    bg: '#FFFBEB',
    selectedBg: '#FEF3C7',
    borderColor: '#FDE68A',
    selectedBorderColor: '#F59E0B',
    textColor: '#92400E',
  },
  {
    label: 'Mild dizziness',
    icon: 'alert-circle-outline',
    severity: 'alert',
    bg: '#FEF2F2',
    selectedBg: '#FEE2E2',
    borderColor: '#FECACA',
    selectedBorderColor: '#FCA5A5',
    textColor: '#991B1B',
  },
  {
    label: 'Nausea',
    icon: 'emoticon-sick-outline',
    severity: 'alert',
    bg: '#FEF2F2',
    selectedBg: '#FEE2E2',
    borderColor: '#FECACA',
    selectedBorderColor: '#FCA5A5',
    textColor: '#991B1B',
  },
];

export const DoseNoteModal: React.FC<DoseNoteModalProps> = ({
  visible,
  medName,
  scheduledTime,
  currentNotes = '',
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setNotes(currentNotes || '');
    }
  }, [visible, currentNotes]);

  const handleTagPress = (tagLabel: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return tagLabel;
      }
      // Check if tag is already present in notes
      if (trimmed.toLowerCase().includes(tagLabel.toLowerCase())) {
        // Toggle off cleanly
        const regex = new RegExp(`(^|,\\s*)${tagLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,\\s*|$)`, 'i');
        return trimmed.replace(regex, '$1').replace(/^,\s*|,\s*$/g, '').trim();
      }
      return `${trimmed}, ${tagLabel}`;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes.trim());
      onClose();
    } catch (err) {
      console.error('Failed to save dose notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerBadge}>
                  <MaterialCommunityIcons name="notebook-edit-outline" size={24} color={THEME.colors.primary} />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.headerTitle}>Clinical Dose Diary</Text>
                  <View style={styles.medMetaRow}>
                    <Text style={styles.medNameText} numberOfLines={1}>{medName}</Text>
                    <View style={styles.timeBadge}>
                      <Feather name="clock" size={12} color="#0369A1" />
                      <Text style={styles.timeBadgeText}>{scheduledTime}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="x" size={20} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Quick Observation Chips */}
                <View style={styles.sectionHeader}>
                  <Feather name="tag" size={13} color={THEME.colors.textMuted} />
                  <Text style={styles.sectionTitle}>QUICK CLINICAL OBSERVATIONS</Text>
                </View>

                <View style={styles.chipsContainer}>
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = notes.toLowerCase().includes(tag.label.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={tag.label}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? tag.selectedBg : tag.bg,
                            borderColor: isSelected ? tag.selectedBorderColor : tag.borderColor,
                            borderWidth: isSelected ? 2 : 1.5,
                          },
                        ]}
                        onPress={() => handleTagPress(tag.label)}
                        activeOpacity={0.75}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons
                          name={tag.icon}
                          size={16}
                          color={tag.textColor}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: tag.textColor,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {tag.label}
                        </Text>
                        {isSelected && (
                          <Feather name="check" size={13} color={tag.textColor} style={{ marginLeft: 2 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Notes Input */}
                <View style={styles.sectionHeader}>
                  <Feather name="edit-3" size={13} color={THEME.colors.textMuted} />
                  <Text style={styles.sectionTitle}>SYMPTOM NOTES & DETAILS</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Blood pressure felt slightly elevated after taking."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={notes}
                    onChangeText={setNotes}
                  />
                  {notes.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => setNotes('')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Dose Log</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  medMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    maxWidth: 160,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    minHeight: 110,
    position: 'relative',
  },
  textInput: {
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 22,
    minHeight: 80,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
