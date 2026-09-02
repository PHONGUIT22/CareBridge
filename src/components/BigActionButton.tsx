import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../constants/theme';
import { Feather } from '@expo/vector-icons';

interface BigActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  variant?: 'primary' | 'success' | 'danger';
  style?: ViewStyle;
}

export const BigActionButton: React.FC<BigActionButtonProps> = ({
  title,
  onPress,
  disabled = false,
  icon = 'check-circle',
  variant = 'primary',
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#94A3B8';
    switch (variant) {
      case 'success':
        return THEME.colors.statusTaken;
      case 'danger':
        return THEME.colors.statusSkipped;
      case 'primary':
      default:
        return THEME.colors.primary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Feather
          name={icon}
          size={24}
          color={THEME.colors.textWhite}
          style={styles.icon}
        />
      )}
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 64,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: THEME.fontSizes.lg,
    fontWeight: '800',
    color: THEME.colors.textWhite,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});