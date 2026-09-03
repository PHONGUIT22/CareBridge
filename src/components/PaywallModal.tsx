import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { SubscriptionService } from '../services/revenuecat';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUnlocked,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const success = await SubscriptionService.purchasePro();
      if (success) {
        Alert.alert('🎉 Welcome to Pro!', 'Unlimited prescriptions & Clinical PDF Export unlocked.');
        onUnlocked();
        onClose();
      }
    } catch (error) {
      Alert.alert('Notice', 'Purchase failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFree = () => {
    SubscriptionService.resetToFree();
    Alert.alert('Reset Free Tier', 'App reverted to Free plan (Max 2 prescriptions).');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={24} color={THEME.light.textSecondary} />
          </TouchableOpacity>

          <View style={styles.badge}>
            <MaterialCommunityIcons name="crown" size={16} color="#B45309" />
            <Text style={styles.badgeText}>CAREBRIDGE PRO PAYWALL</Text>
          </View>

          <Text style={styles.title}>Unlock Clinical Power</Text>
          <Text style={styles.subtitle}>
            You have reached the Free limit (2 prescriptions). Upgrade to Pro for unlimited tracking & doctor reports.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={22} color={THEME.colors.statusTaken} />
              <Text style={styles.featureText}>Unlimited Prescription Punch-Cards (No 2-med limit)</Text>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={22} color={THEME.colors.statusTaken} />
              <Text style={styles.featureText}>Export Certified Clinical PDF Reports for Doctors</Text>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={22} color={THEME.colors.statusTaken} />
              <Text style={styles.featureText}>Family Cloud Caregiver Alerts (OneSignal)</Text>
            </View>
          </View>

          <View style={styles.pricingBox}>
            <View>
              <Text style={styles.pricingTitle}>Pro Family Plan</Text>
              <Text style={styles.pricingSub}>7-Day Free Trial, then $4.99/mo</Text>
            </View>
            <Text style={styles.priceTag}>$4.99</Text>
          </View>

          {/* PRO UPGRADE BUTTON */}
          <TouchableOpacity
            style={styles.purchaseBtn}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseBtnText}>START FREE TRIAL & UNLOCK PRO</Text>
            )}
          </TouchableOpacity>

          {/* RESET TO FREE TIER BUTTON FOR TESTING */}
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetFree}>
            <Text style={styles.resetBtnText}>[Judge Demo] Reset to Free Plan (Lock Features)</Text>
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
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: THEME.light.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.light.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.light.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  featuresList: {
    marginVertical: 18,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.light.textPrimary,
    flex: 1,
  },
  pricingBox: {
    backgroundColor: THEME.colors.primaryLight,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  pricingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.light.textSecondary,
    marginTop: 2,
  },
  priceTag: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.primary,
  },
  purchaseBtn: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  purchaseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resetBtn: {
    alignItems: 'center',
    marginTop: 14,
    padding: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.statusSkipped,
  },
});