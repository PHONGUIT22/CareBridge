export const THEME = {
  // 1. Complete color variables used by App.tsx, CalendarStrip, and HistoryScreen
  colors: {
    // Brand Colors
    primary: '#1E3A8A',       // Navy Blue
    primaryDark: '#0F172A',
    royalBlue: '#2563EB',
    primaryLight: '#EFF6FF',

    // Background & Surfaces
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceLight: '#F1F5F9',
    border: '#CBD5E1',
    borderLight: '#E2E8F0',

    // Text Colors
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textWhite: '#FFFFFF',

    // Status Colors
    statusTaken: '#16A34A',
    statusTakenBg: '#DCFCE7',
    statusNotTaken: '#D97706',
    statusNotTakenBg: '#FEF3C7',
    statusSkipped: '#DC2626',
    statusSkippedBg: '#FEE2E2',
    accentCyan: '#38BDF8',
  },

  // 2. Predefined light mode
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    border: '#CBD5E1',
    borderLight: '#E2E8F0',
  },

  // 3. Predefined dark mode for the desk stand screen
  dark: {
    background: '#0B0F19',
    surface: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
  },

  // Clear, senior-friendly font sizes
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    giant: 54,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};