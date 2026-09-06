import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { THEME } from '../constants/theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';

interface MedicineCardProps {
  name: string;
  dosage: string;
  intakeCount?: number;
  isTaken: boolean;
  isFuture?: boolean; // Lock action if date is in the future
  takenAt?: string;
  notes?: string;
  imageUri?: string;
  stockCount?: number;
  type?: 'medication' | 'routine';
  onRefill?: () => void;
  onToggleTake: () => void;
  onPressCard?: () => void;
  onOpenNoteModal?: () => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  name,
  dosage,
  intakeCount = 1,
  isTaken,
  isFuture = false,
  takenAt,
  notes,
  imageUri,
  stockCount,
  type = 'medication',
  onRefill,
  onToggleTake,
  onPressCard,
  onOpenNoteModal,
}) => {
  const { showAlert } = useAlert();

  const handleFuturePress = () => {
    showAlert({
      title: 'Upcoming Prescription',
      message: 'You cannot log medication for future dates in advance. Please wait until the scheduled day.',
      type: 'info',
      confirmText: 'OK',
    });
  };

  // Determine pastel background and icon styling based on category and status
  const getCategoryTheme = () => {
    if (isTaken) {
      return {
        bg: '#DCFCE7',
        color: '#16A34A',
        iconName: 'check',
        isMaterial: false,
      };
    }
    if (type === 'routine') {
      return {
        bg: '#EEF2FF',
        color: '#4F46E5',
        iconName: 'heart-pulse',
        isMaterial: true,
      };
    }
    const lower = (name || '').toLowerCase();
    if (lower.includes('pressure') || lower.includes('heart') || lower.includes('aspirin')) {
      return {
        bg: '#FEE2E2',
        color: '#E11D48',
        iconName: 'heart-pulse',
        isMaterial: true,
      };
    }
    if (lower.includes('sugar') || lower.includes('diabetes')) {
      return {
        bg: '#E0F2FE',
        color: '#0284C7',
        iconName: 'water-percent',
        isMaterial: true,
      };
    }
    return {
      bg: '#EFF6FF',
      color: '#2563EB',
      iconName: 'pill',
      isMaterial: true,
    };
  };

  const catTheme = getCategoryTheme();

  return (
    <View style={styles.card}>
      {/* LEFT COLUMN: Press to open EDIT / DELETE modal */}
      <TouchableOpacity
        style={styles.leftCol}
        onPress={onPressCard}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <View style={styles.imageThumbnailWrapper}>
            <Image source={{ uri: imageUri }} style={styles.pillThumb} />
            {isTaken && (
              <View style={styles.takenBadgeOverlay}>
                <Feather name="check" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.circularIconContainer, { backgroundColor: catTheme.bg }]}>
            {catTheme.isMaterial ? (
              <MaterialCommunityIcons name={catTheme.iconName as any} size={24} color={catTheme.color} />
            ) : (
              <Feather name={catTheme.iconName as any} size={22} color={catTheme.color} />
            )}
          </View>
        )}

        <View style={styles.infoCol}>
          {/* Medication Name */}
          <Text style={styles.medName} numberOfLines={2}>
            {name}
          </Text>

          {/* Sub-row containing category / refill stock badge and edit icon */}
          <View style={styles.subBadgeRow}>
            {type === 'routine' ? (
              <View style={[styles.stockBadge, { backgroundColor: '#EEF2FF' }]}>
                <MaterialCommunityIcons name="heart-pulse" size={11} color="#4F46E5" />
                <Text style={[styles.stockText, { color: '#4F46E5' }]}>Routine</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.stockBadge,
                  (stockCount ?? 30) <= 5 ? styles.stockBadgeLow : styles.stockBadgeNormal,
                ]}
                onPress={onRefill}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="pill"
                  size={11}
                  color={(stockCount ?? 30) <= 5 ? '#DC2626' : THEME.colors.primary}
                />
                <Text
                  style={[
                    styles.stockText,
                    (stockCount ?? 30) <= 5 ? styles.stockTextLow : styles.stockTextNormal,
                  ]}
                >
                  {(stockCount ?? 30) <= 5 ? `${stockCount ?? 0} left (Refill)` : `${stockCount ?? 30} pills`}
                </Text>
              </TouchableOpacity>
            )}
            <Feather name="edit-2" size={12} color={THEME.light.textMuted} style={{ marginLeft: 6 }} />
          </View>

          <Text style={styles.dosageText}>
            {type === 'routine' ? dosage : `${dosage} • Take ${intakeCount} pill${intakeCount > 1 ? 's' : ''}`}
          </Text>

          {/* Status Timing Label & Clinical Note Pill */}
          {isTaken ? (
            <TouchableOpacity
              onPress={onOpenNoteModal}
              onLongPress={onOpenNoteModal}
              activeOpacity={0.7}
              style={styles.statusNoteContainer}
            >
              <Text style={styles.takenLabel}>
                {type === 'routine' ? `Completed at ${takenAt || 'scheduled time'}` : `Taken at ${takenAt || 'scheduled time'}`}
              </Text>
              {notes && notes.trim().length > 0 ? (
                <View style={styles.notePill}>
                  <Feather name="file-text" size={11} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.notePillText} numberOfLines={1}>
                    {notes}
                  </Text>
                </View>
              ) : (
                <View style={styles.addNotePrompt}>
                  <Feather name="edit-3" size={10} color="#0284C7" style={{ marginRight: 3 }} />
                  <Text style={styles.addNotePromptText}>Add note</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : isFuture ? (
            <Text style={styles.futureLabel}>Scheduled (Upcoming)</Text>
          ) : (
            <TouchableOpacity
              onPress={onOpenNoteModal}
              onLongPress={onOpenNoteModal}
              activeOpacity={0.7}
              style={styles.statusNoteContainer}
            >
              <Text style={styles.notTakenLabel}>
                {type === 'routine' ? 'Not completed' : 'Not taken'}
              </Text>
              {notes && notes.trim().length > 0 && (
                <View style={styles.notePill}>
                  <Feather name="file-text" size={11} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.notePillText} numberOfLines={1}>
                    {notes}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* RIGHT COLUMN: ACTION PILL BUTTON */}
      <View style={styles.rightCol}>
        {isFuture ? (
          <TouchableOpacity
            style={styles.pillBtnLocked}
            onPress={handleFuturePress}
            activeOpacity={0.7}
          >
            <Feather name="lock" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.pillTextLocked}>Locked</Text>
          </TouchableOpacity>
        ) : isTaken ? (
          <TouchableOpacity
            style={styles.pillBtnTaken}
            onPress={onToggleTake}
            onLongPress={onOpenNoteModal}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={15} color="#15803D" style={{ marginRight: 4 }} />
            <Text style={styles.pillTextTaken}>{type === 'routine' ? 'Done' : 'Taken'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pillBtnTake}
            onPress={onToggleTake}
            onLongPress={onOpenNoteModal}
            activeOpacity={0.85}
          >
            <Text style={styles.pillTextTake}>{type === 'routine' ? 'Done' : 'Take'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Soft clinical shadow without harsh borders
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circularIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
    paddingRight: 6,
  },
  subBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  medName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  dosageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  takenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 3,
  },
  notTakenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 3,
  },
  futureLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.royalBlue,
    marginTop: 3,
  },
  statusNoteContainer: {
    alignSelf: 'flex-start',
    marginTop: 2,
    maxWidth: '100%',
  },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    maxWidth: 200,
  },
  notePillText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    fontWeight: '500',
  },
  addNotePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  addNotePromptText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  rightCol: {
    marginLeft: 10,
  },
  // Pill button styles
  pillBtnTake: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  pillTextTake: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pillBtnTaken: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextTaken: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '800',
  },
  pillBtnLocked: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextLocked: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  imageThumbnailWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  pillThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  takenBadgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#16A34A',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockBadgeNormal: {
    backgroundColor: '#EFF6FF',
  },
  stockBadgeLow: {
    backgroundColor: '#FEE2E2',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextNormal: {
    color: THEME.colors.primary,
  },
  stockTextLow: {
    color: '#DC2626',
    fontWeight: '800',
  },
});