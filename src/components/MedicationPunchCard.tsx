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
import { formatToISODate } from '../utils/dateUtils';
import { DailyLogItem } from '../database/logRepo';

interface MedicationPunchCardProps {
  medicineName: string;
  dosage: string;
  time: string;
  createdAt?: string;
  themeColor?: string;
  logs: DailyLogItem[];
  onToggleToday?: () => void;
}

const CELL_SIZE = 11;
const CELL_GAP = 3.5;
const WEEKS_COUNT = 18; // 18 rolling calendar weeks
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MedicationPunchCard: React.FC<MedicationPunchCardProps> = ({
  medicineName,
  dosage,
  time,
  createdAt,
  themeColor = THEME.colors.primary,
  logs,
  onToggleToday,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  // Accurately align with Monday -> Sunday calendar
  const { matrix, streak, complianceRate, takenCount, isTodayTaken } = useMemo(() => {
    const today = new Date();
    const todayStr = formatToISODate(today);
    const startDate = createdAt ? createdAt.split('T')[0] : todayStr;

    // 1. Find Monday of current week
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - daysFromMonday);

    // 2. Go back 18 weeks (starting from Monday)
    const startMonday = new Date(currentMonday);
    startMonday.setDate(currentMonday.getDate() - (WEEKS_COUNT - 1) * 7);

    // Map logs for this medication
    const medLogMap = new Map<string, boolean>();
    logs.forEach((l) => {
      if (l.name.toLowerCase() === medicineName.toLowerCase() && l.isTaken) {
        medLogMap.set(l.date, true);
      }
    });

    let totalTaken = 0;
    let totalScheduledDays = 0;

    // 3. Build matrix: Columns = Weeks, Rows = Day of week (0: Mon -> 6: Sun)
    const columns = [];
    for (let w = 0; w < WEEKS_COUNT; w++) {
      const weekCol = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startMonday);
        cellDate.setDate(startMonday.getDate() + w * 7 + d);
        const dateStr = formatToISODate(cellDate);

        const isToday = dateStr === todayStr;
        const isFuture = dateStr > todayStr;
        const isBeforeStart = dateStr < startDate;
        const taken = !!medLogMap.get(dateStr);

        if (!isBeforeStart && !isFuture) {
          totalScheduledDays++;
          if (taken) totalTaken++;
        }

        weekCol.push({
          date: dateStr,
          taken,
          isToday,
          isFuture,
          isBeforeStart,
          dayIndex: d, // 0 = M, 1 = T, 2 = W, 3 = T, 4 = F, 5 = S, 6 = S
        });
      }
      columns.push(weekCol);
    }

    // 4. Calculate streak backwards from today
    let currentStreak = 0;
    let checkDate = new Date(today);
    while (true) {
      const dStr = formatToISODate(checkDate);
      if (dStr < startDate) break;

      if (medLogMap.get(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is not yet taken, do not break yesterday's streak
        if (dStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    const rate =
      totalScheduledDays > 0
        ? Math.round((totalTaken / totalScheduledDays) * 100)
        : 100;

    return {
      matrix: columns,
      streak: currentStreak,
      complianceRate: rate,
      takenCount: totalTaken,
      isTodayTaken: !!medLogMap.get(todayStr),
    };
  }, [logs, medicineName, createdAt]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: themeColor }]}>
      {/* HEADER */}
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

      {/* MATRIX GRID: ALIGNED M - T - W - T - F - S - S */}
      <View style={styles.gridWrapper}>
        <View style={styles.yAxisLabels}>
          {WEEKDAYS.map((label, idx) => (
            <Text key={idx} style={styles.dayLabelText}>
              {label}
            </Text>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
        >
          {matrix.map((weekCol, wIdx) => (
            <View key={wIdx} style={styles.weekColumn}>
              {weekCol.map((cell) => {
                return (
                  <View
                    key={cell.date}
                    style={[
                      styles.punchCell,
                      cell.taken
                        ? styles.punchCellFilled           // Taken -> Bright white cell
                        : cell.isBeforeStart || cell.isFuture
                        ? styles.punchCellDisabled         // Not created or future -> Dim dark
                        : styles.punchCellEmpty,           // Scheduled but not taken -> Medium dim
                      cell.isToday && styles.punchCellToday,// Today -> Highlighted yellow border
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* FOOTER */}
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
    color: 'rgba(255, 255, 255, 0.75)',
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
  // Taken -> Bright white highlight
  punchCellFilled: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  // Scheduled in period but not taken
  punchCellEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  // Prior to creation date or future date
  punchCellDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  // Today highlighted yellow border
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