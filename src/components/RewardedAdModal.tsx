import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { THEME } from '../constants/theme';
import { RevenueCatService } from '../services/revenuecat';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';

interface RewardedAdModalProps {
  visible: boolean;
  onAdCompleted: () => void;
  onClose: () => void;
  placement: 'export_pdf' | 'add_prescription' | 'refill_stock';
  medicineName?: string;
}

// Use Google Test ID to prevent policy violations during development
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxx/yyyyyyyyyy';
const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  onAdCompleted,
  onClose,
  placement,
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // 1. Load ad from Google servers
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
      rewarded.show(); // Show immediately once loaded
    });

    // 2. User completes watching and earns reward
    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      onAdCompleted();
      onClose();
    });

    // 3. Ad revenue attribution: capture revenue event from Google to send to RevenueCat (onPaidEvent -> AdEventType.PAID)
    const unsubscribePaid = rewarded.addAdEventListener(AdEventType.PAID, (paidEvent: any) => {
      // paidEvent.value is revenue in micro-currency (micros). Divide by 1,000,000.
      const revenueInUSD = paidEvent?.value ? paidEvent.value / 1000000 : 0.05;

      RevenueCatService.trackAdImpression(
        'AdMob',
        placement,
        revenueInUSD
      );
    });

    // If user closes the ad midway
    const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      onClose();
    });

    // Fallback if ad cannot be loaded
    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[AdMob Rewarded Error]', error);
      Alert.alert(
        'Ad Notice',
        'Could not load sponsored ad. Proceeding with reward...',
        [
          {
            text: 'OK',
            onPress: () => {
              onAdCompleted();
              onClose();
            },
          },
        ]
      );
    });

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribePaid();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [visible, placement, onAdCompleted, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.adCard}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading Sponsored Message...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  adCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, fontWeight: '700', color: THEME.colors.primary },
});