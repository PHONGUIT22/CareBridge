import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { generateDateRange, formatToISODate } from '../utils/dateUtils';
import { DailyLogItem } from '../database/logRepo';

interface MedicationPunchCardProps {
  medicineName: string;
  dosage: string;
  time: string;
  themeColor?: string;
  logs: DailyLogItem[];
  onToggleToday?: () => void;
}

const CELL_SIZE = 11;
const CELL_GAP = 3;
const WEEKS_COUNT = 20; // 20 rolling weeks (140 days punch matrix)
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MedicationPunchCard: React.FC<MedicationPunchCardProps> = ({
  medicineName,
  dosage,
  time,
  themeColor = THEME.colors.primary,
  logs,
  onToggleToday,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  // 1. Build matrix of 20 weeks x 7 days
  const { matrix, streak, complianceRate, takenCount, isTodayTaken } = useMemo(() => {
    const todayStr = formatToISODate(new Date());
    const totalDays = WEEKS_COUNT * 7;
    const dates = generateDateRange(totalDays).reverse(); // Past -> Present

    // Map logs of THIS medicine for fast lookup
    const medLogMap = new Map<string, boolean>();
    logs.forEach((l) => {
      if (l.name.toLowerCase() === medicineName.toLowerCase() && l.isTaken) {
        medLogMap.set(l.date, true);
      }
    });

    let currentStreak = 0;
    let totalTaken = 0;

    // Check streak backwards from today
    for (let i = dates.length - 1; i >= 0; i--) {
      if (medLogMap.get(dates[i])) {
        currentStreak++;
      } else if (dates[i] < todayStr) {
        break;
      }
    }

    // Build 2D matrix (Columns = Weeks, Rows = 7 Days)
    const columns: { date: string; taken: boolean; isToday: boolean }[][] = [];
    for (let w = 0; w < WEEKS_COUNT; w++) {
      const weekCol = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = dates[w * 7 + d];
        const taken = !!medLogMap.get(dateStr);
        if (taken) totalTaken++;
        weekCol.push({
          date: dateStr,
          taken,
          isToday: dateStr === todayStr,
        });
      }
      columns.push(weekCol);
    }

    const rate = Math.round((totalTaken / totalDays) * 100);
    const todayTaken = !!medLogMap.get(todayStr);

    return {
      matrix: columns,
      streak: currentStreak,
      complianceRate: rate,
      takenCount: totalTaken,
      isTodayTaken: todayTaken,
    };
  }, [logs, medicineName]);

  // Auto-scroll to latest week on right
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: themeColor }]}>
      {/* 1. CARD TOP: Icon, Name, Dosage & Today Status Toggle */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="pill" size={22} color="#FFFFFF" />
        </View>

        <View style={styles.nameCol}>
          <Text style={styles.medName} numberOfLines={1}>
            {medicineName}
          </Text>
          <Text style={styles.dosageText}>
            {dosage} • Scheduled at {time}
          </Text>
        </View>

        {/* Checkmark Button for Today */}
        <TouchableOpacity
          style={[
            styles.todayCheckBtn,
            isTodayTaken ? styles.todayCheckBtnActive : styles.todayCheckBtnInactive,
          ]}
          onPress={onToggleToday}
          activeOpacity={0.8}
        >
          <Feather
            name={isTodayTaken ? 'check' : 'circle'}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* 2. PUNCH HOLE MATRIX GRID (7 ROWS x 20 COLUMNS) */}
      <View style={styles.gridWrapper}>
        {/* Y-Axis day labels */}
        <View style={styles.yAxisLabels}>
          {WEEKDAYS.map((label, idx) => (
            <Text key={idx} style={styles.dayLabelText}>
              {label}
            </Text>
          ))}
        </View>

        {/* Scrollable Punch Board */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
        >
          {matrix.map((weekCol, wIdx) => (
            <View key={wIdx} style={styles.weekColumn}>
              {weekCol.map((cell, dIdx) => (
                <View
                  key={dIdx}
                  style={[
                    styles.punchCell,
                    cell.taken
                      ? styles.punchCellFilled
                      : styles.punchCellEmpty,
                    cell.isToday && styles.punchCellToday,
                  ]}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 3. CARD FOOTER: STREAK & COMPLIANCE STATS */}
      <View style={styles.footerRow}>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={16} color="#FED7AA" />
          <Text style={styles.statText}>{streak} Day Streak</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Feather name="check-circle" size={14} color="#BBF7D0" />
          <Text style={styles.statText}>{takenCount} Completed</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Feather name="activity" size={14} color="#E0F2FE" />
          <Text style={styles.statText}>{complianceRate}% Adherence</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nameCol: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  dosageText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  todayCheckBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCheckBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  todayCheckBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  gridWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    height: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    paddingRight: 8,
  },
  dayLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: CELL_SIZE,
    textAlign: 'center',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: CELL_GAP,
    paddingRight: 4,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: CELL_GAP,
  },
  punchCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2.5,
  },
  // Ô sáng bừng khi đã uống thuốc
  punchCellFilled: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  // Ô mờ khi chưa uống
  punchCellEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  // Viền nổi bật cho ngày hôm nay
  punchCellToday: {
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});