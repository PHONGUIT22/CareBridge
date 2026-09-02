import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

interface SeniorClockProps {
  dark?: boolean;
}

export const SeniorClock: React.FC<SeniorClockProps> = ({ dark = false }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const formattedDate = time
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Text style={[styles.timeText, dark ? styles.textLight : styles.textDark]}>
        {hours}:{minutes}
        <Text style={styles.secondsText}>:{seconds}</Text>
      </Text>
      <Text style={[styles.dateText, dark ? styles.dateLight : styles.dateDark]}>
        {formattedDate}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  secondsText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#94A3B8',
  },
  textDark: {
    color: THEME.colors.textPrimary,
  },
  textLight: {
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 1.2,
  },
  dateDark: {
    color: THEME.colors.primary,
  },
  dateLight: {
    color: '#60A5FA',
  },
});