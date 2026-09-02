import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useMedicines } from '../hooks/useMedicines';
import { Feather, Ionicons } from '@expo/vector-icons';

export const DeskModeScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const today = new Date();
  const { logs, handleToggleTake } = useMedicines(today);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  // Find the next upcoming pending dose
  const nextPill = logs.find((item) => !item.isTaken);

  const handleConfirmIntake = async () => {
    if (nextPill) {
      await handleToggleTake(nextPill.logId, nextPill.status);
      Alert.alert('Confirmed', `${nextPill.name} marked as taken!`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP BAR: Mode indicator */}
      <View style={styles.topBar}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.modeText}>DESK STAND MODE</Text>
        </View>
        <Ionicons name="moon" size={20} color="#94A3B8" />
      </View>

      {/* 2. CENTER: Giant Digital Clock */}
      <View style={styles.clockSection}>
        <Text style={styles.giantClockText}>
          {hours}:{minutes}
          <Text style={styles.secondsText}>:{seconds}</Text>
        </Text>
        <Text style={styles.dateHeadline}>{dateFormatted}</Text>
      </View>

      {/* 3. BOTTOM: Upcoming Medication Banner & Quick-Action Button */}
      <View style={styles.bottomSection}>
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Feather name="bell" size={18} color="#60A5FA" />
            <Text style={styles.promptSubtitle}>UPCOMING DOSE</Text>
          </View>

          {nextPill ? (
            <View style={styles.medRow}>
              <View style={styles.medInfo}>
                <Text style={styles.medTime}>{nextPill.scheduledTime}</Text>
                <Text style={styles.medName}>
                  {nextPill.name} • {nextPill.dosage}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.quickTakeButton}
                onPress={handleConfirmIntake}
                activeOpacity={0.8}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
                <Text style={styles.quickTakeText}>TAKE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.allDoneRow}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.allDoneText}>All doses completed for today!</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D', // Deep midnight slate background
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  modeText: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  clockSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  giantClockText: {
    fontSize: 68,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  secondsText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#64748B',
  },
  dateHeadline: {
    fontSize: THEME.fontSizes.md,
    fontWeight: '700',
    color: '#60A5FA',
    marginTop: 8,
    letterSpacing: 1.2,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  promptCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  promptSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1.2,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medInfo: {
    flex: 1,
  },
  medTime: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  medName: {
    fontSize: THEME.fontSizes.md,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  quickTakeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  quickTakeText: {
    color: '#FFFFFF',
    fontSize: THEME.fontSizes.md,
    fontWeight: '800',
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  allDoneText: {
    fontSize: THEME.fontSizes.md,
    fontWeight: '700',
    color: '#E2E8F0',
  },
});