import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useHeatmap, HeatmapPeriod, HeatmapDayEntry, DayComplianceStatus } from '../hooks/useHeatmap';
import { Feather, Ionicons } from '@expo/vector-icons';

interface ContributionGraphProps {
  period?: HeatmapPeriod; // 'weekly' | 'monthly' | 'overall'
  title?: string;
  onSelectDay?: (day: HeatmapDayEntry) => void;
}

const CELL_SIZE = 14;
const CELL_GAP = 4;
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  period = 'monthly',
  title = 'Medication Adherence Heatmap',
  onSelectDay,
}) => {
  const { weeksMatrix, summary, isLoading, error } = useHeatmap(period);
  const scrollRef = useRef<ScrollView>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDayEntry | null>(null);

  // Auto-scroll to the far right (today) on load
  useEffect(() => {
    if (weeksMatrix.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [weeksMatrix]);

  const getCellColor = (status: DayComplianceStatus) => {
    switch (status) {
      case 'taken':
        return THEME.colors.statusTaken;    // High-contrast Emerald Green
      case 'partial':
        return THEME.colors.statusNotTaken; // High-contrast Amber
      case 'skipped':
        return THEME.colors.statusSkipped;  // High-contrast Coral Red
      case 'none':
      default:
        return THEME.light.borderLight;     // Neutral Slate Gray
    }
  };

  const handleCellPress = (day: HeatmapDayEntry) => {
    setSelectedDay(day);
    if (onSelectDay) onSelectDay(day);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Building adherence matrix...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Could not load adherence history.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* 1. HEADER: Title & Key Summary Badges */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.cardSubtitle}>30-DAY COMPLIANCE PUNCH-CARD</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#EA580C" />
          <Text style={styles.streakText}>{summary.currentStreak}d Streak</Text>
        </View>
      </View>

      {/* 2. HEATMAP MATRIX WITH Y-AXIS LABELS */}
      <View style={styles.matrixContainer}>
        {/* Y-Axis: Mon to Sun labels */}
        <View style={styles.yAxis}>
          {WEEKDAY_LABELS.map((dayLabel, index) => (
            <Text key={index} style={styles.weekdayLabel}>
              {dayLabel}
            </Text>
          ))}
        </View>

        {/* Scrollable Columns of 7-Day Weeks */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          contentContainerStyle={styles.scrollGrid}
        >
          {weeksMatrix.map((weekCol) => (
            <View key={weekCol.weekIndex} style={styles.weekColumn}>
              {weekCol.days.map((day) => {
                const isSelected = selectedDay?.date === day.date;
                return (
                  <TouchableOpacity
                    key={day.date}
                    activeOpacity={0.7}
                    onPress={() => handleCellPress(day)}
                    style={[
                      styles.cell,
                      { backgroundColor: getCellColor(day.status) },
                      isSelected && styles.cellSelected,
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 3. SELECTED DAY POPUP TOOLTIP */}
      {selectedDay && (
        <View style={styles.tooltipBox}>
          <View style={styles.tooltipHeader}>
            <Feather name="calendar" size={14} color={THEME.colors.primary} />
            <Text style={styles.tooltipDate}>{selectedDay.date} ({selectedDay.dayName})</Text>
          </View>
          <Text style={styles.tooltipStatus}>
            {selectedDay.totalCount === 0
              ? 'No prescriptions scheduled'
              : `${selectedDay.takenCount}/${selectedDay.totalCount} doses taken • ${selectedDay.adherenceRate}% adherence`}
          </Text>
        </View>
      )}

      {/* 4. COLOR LEGEND FOOTER */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.light.borderLight }]} />
          <Text style={styles.legendLabel}>None</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.statusTaken }]} />
          <Text style={styles.legendLabel}>100% Taken</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.statusNotTaken }]} />
          <Text style={styles.legendLabel}>Partial</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.statusSkipped }]} />
          <Text style={styles.legendLabel}>Missed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.light.surface,
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: THEME.light.borderLight,
    ...THEME.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.royalBlue,
    letterSpacing: 1.2,
  },
  cardTitle: {
    fontSize: THEME.fontSizes.md,
    fontWeight: '900',
    color: THEME.light.textPrimary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakText: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '800',
    color: '#9A3412',
  },
  matrixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    height: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP,
  },
  weekdayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.light.textMuted,
    lineHeight: CELL_SIZE,
    textAlign: 'center',
    width: 12,
  },
  scrollGrid: {
    flexDirection: 'row',
    gap: CELL_GAP,
    paddingVertical: 2,
    paddingRight: 6,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.primaryDark,
    transform: [{ scale: 1.2 }],
  },
  tooltipBox: {
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.light.border,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipDate: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  tooltipStatus: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '600',
    color: THEME.light.textSecondary,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.light.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 2.5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.light.textMuted,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '600',
    color: THEME.light.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: THEME.fontSizes.xs,
    color: THEME.colors.statusSkipped,
    fontWeight: '600',
  },
});