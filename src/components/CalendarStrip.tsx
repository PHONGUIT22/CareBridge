import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Generate 7 days around the active date
  const getDays = () => {
    const days: Date[] = [];
    const base = new Date(selectedDate);
    base.setDate(base.getDate() - 3);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getDays();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const formattedMonth = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.monthText}>{formattedMonth}</Text>
      </View>

      <View style={styles.stripWrapper}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            onSelectDate(prev);
          }}
        >
          <Feather name="chevron-left" size={22} color={THEME.colors.primary} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {days.map((item, idx) => {
            const active = isSameDay(item, selectedDate);
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => onSelectDate(item)}
                style={[styles.dayCard, active && styles.dayCardActive]}
              >
                <Text style={[styles.dayNumber, active && styles.textWhite]}>
                  {item.getDate()}
                </Text>
                <Text style={[styles.dayName, active && styles.textWhite]}>
                  {dayNames[item.getDay()]}
                </Text>

                {/* Dose indicator dots */}
                <View style={styles.dotRow}>
                  <View style={[styles.dot, active ? styles.dotWhite : styles.dotNavy]} />
                  <View style={[styles.dot, active ? styles.dotWhite : styles.dotNavy]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            onSelectDate(next);
          }}
        >
          <Feather name="chevron-right" size={22} color={THEME.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  monthText: {
    fontSize: THEME.fontSizes.md,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
  },
  stripWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  navBtn: {
    padding: 6,
  },
  scroll: {
    gap: 8,
    paddingHorizontal: 4,
  },
  dayCard: {
    width: 54,
    height: 76,
    borderRadius: 14,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayNumber: {
    fontSize: THEME.fontSizes.lg,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  dayName: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  textWhite: {
    color: THEME.colors.textWhite,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotWhite: {
    backgroundColor: THEME.colors.textWhite,
  },
  dotNavy: {
    backgroundColor: THEME.colors.primary,
  },
});