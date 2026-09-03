import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { THEME } from '../constants/theme';
import { Feather, Ionicons } from '@expo/vector-icons';

interface MedicineCardProps {
  name: string;
  dosage: string;
  intakeCount?: number;
  isTaken: boolean;
  isFuture?: boolean; // <-- Lock if date is in the future
  takenAt?: string;
  onToggleTake: () => void;
  onPressCard?: () => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  name,
  dosage,
  intakeCount = 1,
  isTaken,
  isFuture = false,
  takenAt,
  onToggleTake,
  onPressCard,
}) => {
  const handleFuturePress = () => {
    Alert.alert(
      'Upcoming Prescription',
      'You cannot log medication for future dates in advance. Please wait until the scheduled day.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.card}>
      {/* LEFT COLUMN: Press to open EDIT / DELETE modal */}
      <TouchableOpacity
        style={styles.leftCol}
        onPress={onPressCard}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.statusIcon,
            isTaken
              ? styles.iconTaken
              : isFuture
              ? styles.iconFuture
              : styles.iconPending,
          ]}
        >
          {isTaken ? (
            <Feather name="check" size={20} color="#FFFFFF" />
          ) : isFuture ? (
            <Feather name="clock" size={18} color={THEME.colors.royalBlue} />
          ) : (
            <Feather name="minus" size={20} color={THEME.light.textMuted} />
          )}
        </View>

        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text style={styles.medName}>{name}</Text>
            <Feather name="edit-2" size={14} color={THEME.light.textMuted} style={{ marginLeft: 6 }} />
          </View>

          <Text style={styles.dosageText}>
            {dosage} • Take {intakeCount} pill{intakeCount > 1 ? 's' : ''}
          </Text>

          {/* STATUS LABEL */}
          {isTaken ? (
            <Text style={styles.takenLabel}>Taken at {takenAt || 'scheduled time'}</Text>
          ) : isFuture ? (
            <Text style={styles.futureLabel}>Scheduled (Upcoming)</Text>
          ) : (
            <Text style={styles.notTakenLabel}>Not taken</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* RIGHT COLUMN: ACTION BUTTON (LOCKED IF FUTURE) */}
      <View style={styles.rightCol}>
        {isFuture ? (
          <TouchableOpacity
            style={styles.lockedBtn}
            onPress={handleFuturePress}
            activeOpacity={0.7}
          >
            <Feather name="lock" size={14} color={THEME.light.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.lockedBtnText}>Locked</Text>
          </TouchableOpacity>
        ) : isTaken ? (
          <TouchableOpacity style={styles.unTakeBtn} onPress={onToggleTake} activeOpacity={0.7}>
            <Ionicons name="refresh" size={16} color={THEME.light.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.unTakeText}>Un-take</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.takeBtn} onPress={onToggleTake} activeOpacity={0.8}>
            <Text style={styles.takeText}>Take</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: THEME.light.borderLight,
    ...THEME.shadows.card,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconTaken: {
    backgroundColor: THEME.colors.statusTaken,
  },
  iconPending: {
    backgroundColor: '#E2E8F0',
  },
  iconFuture: {
    backgroundColor: THEME.colors.primaryLight,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medName: {
    fontSize: THEME.fontSizes.lg,
    fontWeight: '800',
    color: THEME.light.textPrimary,
  },
  dosageText: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '600',
    color: THEME.light.textSecondary,
    marginTop: 2,
  },
  takenLabel: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '700',
    color: THEME.colors.statusTaken,
    marginTop: 4,
  },
  notTakenLabel: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '700',
    color: THEME.colors.statusNotTaken,
    marginTop: 4,
  },
  futureLabel: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '700',
    color: THEME.colors.royalBlue,
    marginTop: 4,
  },
  rightCol: {
    marginLeft: 12,
  },
  takeBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeText: {
    color: THEME.colors.textWhite,
    fontSize: THEME.fontSizes.md,
    fontWeight: '800',
  },
  unTakeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.light.border,
  },
  unTakeText: {
    color: THEME.light.textSecondary,
    fontSize: THEME.fontSizes.sm,
    fontWeight: '700',
  },
  lockedBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.light.borderLight,
    opacity: 0.85,
  },
  lockedBtnText: {
    color: THEME.light.textMuted,
    fontSize: THEME.fontSizes.sm,
    fontWeight: '700',
  },
});