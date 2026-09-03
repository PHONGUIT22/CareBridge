import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { RevenueCatService } from '../services/revenuecat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface RewardedAdModalProps {
  visible: boolean;
  onAdCompleted: () => void;
  onClose: () => void;
  placement: 'export_pdf' | 'add_prescription' | 'refill_stock';
  medicineName?: string;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  onAdCompleted,
  onClose,
  placement,
  medicineName,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      setCanClaim(false);
      return;
    }

    // 5-second countdown simulating sponsored partner ad view
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaim(true);
          // Record sponsored partner ad revenue into RevenueCat telemetry
          RevenueCatService.trackAdImpression('Sponsored_Partner', placement, 0.05);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, placement]);

  const handleClaim = () => {
    onClose();
    onAdCompleted();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.adCard}>
          {/* Header */}
          <View style={styles.topBadge}>
            <View style={styles.partnerBadge}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#1E40AF" />
              <Text style={styles.partnerBadgeText}>SPONSORED CLINICAL PARTNER</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{canClaim ? 'Ready' : `${countdown}s`}</Text>
            </View>
          </View>

          {/* Sponsored partner ad content */}
          <View style={styles.adContent}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="heart-pulse" size={42} color={THEME.colors.primary} />
            </View>
            <Text style={styles.adTitle}>Omron Healthcare Solution</Text>
            <Text style={styles.adDesc}>
              Regular blood pressure tracking reduces cardiovascular risks by 40%. Consistency is key to longevity.
            </Text>
          </View>

          {/* Claim reward button */}
          <TouchableOpacity
            style={[styles.claimBtn, !canClaim && styles.claimBtnDisabled]}
            disabled={!canClaim}
            onPress={handleClaim}
            activeOpacity={0.85}
          >
            {canClaim ? (
              <View style={styles.btnRow}>
                <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
                <Text style={styles.claimBtnText}>
                  {placement === 'refill_stock'
                    ? `CLAIM +30 PILLS ${medicineName ? `(${medicineName.toUpperCase()})` : ''}`
                    : placement === 'export_pdf'
                    ? 'UNLOCK PDF REPORT'
                    : 'SAVE PRESCRIPTION'}
                </Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.claimBtnText}>Sponsored Message ({countdown}s)...</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    ...THEME.shadows.card,
  },
  topBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  adContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  adDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  claimBtn: {
    backgroundColor: THEME.colors.primary,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  claimBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});