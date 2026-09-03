import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { THEME } from '../constants/theme';
import { RevenueCatService } from '../services/revenuecat';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface RewardedAdModalProps {
  visible: boolean;
  onAdCompleted: () => void;
  onClose: () => void;
  placement: 'export_pdf' | 'add_prescription';
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  onAdCompleted,
  onClose,
  placement,
}) => {
  const [countdown, setCountdown] = useState(3);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCountdown(3);
      setCanSkip(false);
      return;
    }

    // Đếm ngược 3 giây
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          // Tự động bắn doanh thu quảng cáo về RevenueCat Dashboard
          RevenueCatService.trackAdImpression('AdMob_Rewarded', placement, 0.05);
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
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.adCard}>
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>SPONSORED HEALTH PARTNER</Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{canSkip ? 'Reward Ready' : `Ad: ${countdown}s`}</Text>
            </View>
          </View>

          <View style={styles.adContent}>
            <MaterialCommunityIcons name="shield-airplane" size={48} color={THEME.colors.primary} />
            <Text style={styles.adTitle}>Omron Healthcare • Daily Health</Text>
            <Text style={styles.adDesc}>
              Taking blood pressure medication regularly reduces cardiovascular risks by 40%. Keep up your streak!
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.claimBtn, !canSkip && styles.claimBtnDisabled]}
            disabled={!canSkip}
            onPress={handleClaim}
          >
            {canSkip ? (
              <Text style={styles.claimBtnText}>CONTINUE TO {placement === 'export_pdf' ? 'EXPORT PDF' : 'ADD MEDICINE'}</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.claimBtnText}>Watching Partner Message ({countdown}s)...</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  adCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360 },
  topBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  topBadgeText: { fontSize: 11, fontWeight: '800', color: THEME.colors.royalBlue, letterSpacing: 1 },
  timerBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timerText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  adContent: { alignItems: 'center', paddingVertical: 14 },
  adTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginTop: 10, textAlign: 'center' },
  adDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  claimBtn: { backgroundColor: THEME.colors.primary, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  claimBtnDisabled: { backgroundColor: '#94A3B8' },
  claimBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});