import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { THEME } from '../constants/theme';
import { SeniorClock } from '../components/SeniorClock';
import { LogRepo, DailyLogItem } from '../database/logRepo';
import { formatToISODate } from '../utils/dateUtils';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SponsoredHealthBanner } from '../components/SponsoredHealthBanner';

export const DeskModeScreen: React.FC = () => {
  const [logs, setLogs] = useState<DailyLogItem[]>([]);
  const todayStr = formatToISODate(new Date());

  // Automatically reload today's doses whenever the tab is focused
  const loadTodayLogs = useCallback(async () => {
    try {
      const data = await LogRepo.getLogsByDate(todayStr);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  }, [todayStr]);

  useFocusEffect(
    useCallback(() => {
      loadTodayLogs();
    }, [loadTodayLogs])
  );

  // Calculate today's adherence progress
  const totalToday = logs.length;
  const takenToday = logs.filter((l) => l.isTaken).length;
  const nextPendingPill = logs.find((l) => !l.isTaken);

  const handleTakePill = async () => {
    if (!nextPendingPill) return;

    await LogRepo.toggleLogStatus(nextPendingPill.logId, nextPendingPill.status);
    await loadTodayLogs();
    Alert.alert('Prescription Logged', `Marked ${nextPendingPill.name} as taken!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP AMBIENT STATUS BAR */}
      <View style={styles.topBar}>
        <View style={styles.ambientBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.ambientText}>DESK STAND MODE</Text>
        </View>

        <View style={styles.timeTag}>
          <Ionicons name="moon" size={16} color="#38BDF8" style={{ marginRight: 4 }} />
          <Text style={styles.timeTagText}>Nightstand</Text>
        </View>
      </View>

      {/* 2. HERO GIANT CLOCK (Prominent focal point) */}
      <View style={styles.clockSection}>
        <SeniorClock dark={true} />
      </View>

      {/* 3. DAILY MEDICATION PROGRESS BAR */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>TODAY'S ADHERENCE</Text>
          <Text style={styles.progressValue}>
            {takenToday} / {totalToday} Doses
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: totalToday > 0 ? `${(takenToday / totalToday) * 100}%` : '100%',
              },
            ]}
          />
        </View>
      </View>

      {/* 4. BOTTOM INTERACTIVE ACTION SECTION */}
      <View style={styles.bottomActionSection}>
        {nextPendingPill ? (
          <View style={styles.doseDueCard}>
            <View style={styles.doseInfoRow}>
              <View style={styles.pillIconBadge}>
                <MaterialCommunityIcons name="pill" size={26} color="#FFFFFF" />
              </View>

              <View style={styles.doseDetails}>
                <Text style={styles.doseDueSub}>UPCOMING DOSE AT {nextPendingPill.scheduledTime}</Text>
                <Text style={styles.doseName}>{nextPendingPill.name}</Text>
                <Text style={styles.doseStrength}>{nextPendingPill.dosage} • Take 1 pill</Text>
              </View>
            </View>

            {/* GIANT "I TOOK MY PILL" ACTION BUTTON */}
            <TouchableOpacity
              style={styles.giantTakeBtn}
              onPress={handleTakePill}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={28} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.giantTakeBtnText}>I TOOK MY PILL</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.allCompletedCard}>
            <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
            <Text style={styles.allCompletedTitle}>All Doses Completed!</Text>
            <Text style={styles.allCompletedSub}>
              You have taken all scheduled medications for today. Rest well!
            </Text>

            {/* GỢI Ý BÀI TẬP THỞ SỨC KHỎE TÀI TRỢ */}
            <View style={{ width: '100%', marginTop: 10 }}>
              <SponsoredHealthBanner placement="desk_completed" />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14', // Deep dark background for eye comfort at night
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 4 : 12,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ambientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  ambientText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  clockSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  progressCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38BDF8',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  bottomActionSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  doseDueCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  doseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  pillIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  doseDetails: {
    flex: 1,
  },
  doseDueSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.2,
  },
  doseName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  doseStrength: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  giantTakeBtn: {
    backgroundColor: '#10B981',
    height: 64,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  giantTakeBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  allCompletedCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  allCompletedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
  },
  allCompletedSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});