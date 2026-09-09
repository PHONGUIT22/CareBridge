import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export type AlertType = 'danger' | 'warning' | 'info' | 'success';

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string; // If cancelText is not provided, modal adapts to single-button Alert format
  onConfirm: () => void;
  onCancel?: () => void;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  visible,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const isTwoButtons = Boolean(cancelText && onCancel);
  const [internalVisible, setInternalVisible] = useState(visible);
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      cardScale.setValue(0.92);
      cardOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1.0,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(cardOpacity, {
          toValue: 1.0,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (internalVisible) {
      Animated.parallel([
        Animated.timing(cardScale, {
          toValue: 0.92,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible, internalVisible, cardScale, cardOpacity]);

  const handleDismiss = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 0.92,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      callback?.();
    });
  };

  const getBadgeStyle = () => {
    switch (type) {
      case 'danger':
        return { bg: '#FEE2E2', border: '#FCA5A5', iconColor: '#DC2626', icon: 'trash-2' };
      case 'warning':
        return { bg: '#FEF3C7', border: '#FDE68A', iconColor: '#D97706', icon: 'alert-triangle' };
      case 'success':
        return { bg: '#DCFCE7', border: '#86EFAC', iconColor: '#16A34A', icon: 'check-circle' };
      case 'info':
      default:
        return { bg: '#EFF6FF', border: '#BFDBFE', iconColor: THEME.colors.primary, icon: 'info' };
    }
  };

  const badge = getBadgeStyle();

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => handleDismiss(onCancel || onConfirm)}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Status icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Feather name={badge.icon as any} size={26} color={badge.iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionRow}>
            {isTwoButtons && onCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleDismiss(onCancel)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                type === 'danger' ? styles.btnDanger : styles.btnPrimary,
                !isTwoButtons && { flex: 1 },
              ]}
              onPress={() => handleDismiss(onConfirm)}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  btnPrimary: {
    backgroundColor: THEME.colors.primary,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
