import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

interface SeniorClockProps {
  dark?: boolean;
}

export const SeniorClock: React.FC<SeniorClockProps> = ({ dark = true }) => {
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
      {/* GIANT DIGITAL CLOCK */}
      <View style={styles.clockRow}>
        <Text style={[styles.timeText, dark ? styles.textLight : styles.textDark]}>
          {hours}:{minutes}
        </Text>
        <Text style={styles.secondsText}>:{seconds}</Text>
      </View>

      {/* BIG ACCENT DATE */}
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
    paddingVertical: 10,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeText: {
    fontSize: 78,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  secondsText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#64748B',
    fontVariant: ['tabular-nums'],
    marginLeft: 4,
  },
  textDark: {
    color: THEME.light.textPrimary,
  },
  textLight: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(56, 189, 248, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 1.5,
  },
  dateDark: {
    color: THEME.colors.primary,
  },
  dateLight: {
    color: '#38BDF8', // Cyan glowing night mode
  },
});