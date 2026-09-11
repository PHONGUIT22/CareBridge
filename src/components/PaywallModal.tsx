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
import { SubscriptionService } from '../services/revenuecat';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked: () => void | Promise<void>;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUnlocked,
}) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [fetchingPackages, setFetchingPackages] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchOfferings();
    }
  }, [visible]);

  const fetchOfferings = async () => {
    setFetchingPackages(true);
    try {
      const pkgs = await SubscriptionService.getPackages();
      setPackages(pkgs);
      // Prioritize $rc_monthly or default to first available package
      const monthlyPkg = pkgs.find((p) => p.identifier === '$rc_monthly') || pkgs[0] || null;
      setSelectedPackage(monthlyPkg);
    } catch (error) {
      console.log('[PaywallModal] Failed to load packages:', error);
    } finally {
      setFetchingPackages(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const success = await SubscriptionService.purchasePro(selectedPackage);
      if (success) {
        await onUnlocked();
        onClose();
        setTimeout(() => {
          showAlert({
            title: '🎉 Welcome to Pro!',
            message: 'Unlimited prescriptions & Clinical PDF Export unlocked.',
            type: 'success',
            confirmText: 'Great!',
          });
        }, 350);
      } else {
        // Fallback for emulator / Expo Go / sandbox without native store billing
        showAlert({
          title: 'Store Billing Unavailable',
          message: 'Native in-app billing is unavailable on this environment. Would you like to use the Instant Demo Unlock to evaluate all Pro features?',
          type: 'info',
          confirmText: 'Unlock Pro (Demo)',
          cancelText: 'Cancel',
          onConfirm: async () => {
            await handleDemoUnlock();
          },
        });
      }
    } catch (error) {
      showAlert({
        title: 'Store Purchase Notice',
        message: 'Could not connect to store billing. You can use the Instant Demo Unlock to evaluate all features.',
        type: 'info',
        confirmText: 'Unlock Pro (Demo)',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await handleDemoUnlock();
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUnlock = async () => {
    SubscriptionService.setLocalPro(true);
    await onUnlocked();
    onClose();
    setTimeout(() => {
      showAlert({
        title: '🎉 Pro Unlocked (Demo)',
        message: 'Pro entitlements active! Unlimited prescriptions & Doctor PDF Export are now unlocked.',
        type: 'success',
      });
    }, 350);
  };

  const handleResetFree = async () => {
    await SubscriptionService.resetToFree();
    await onUnlocked();
    onClose();
    setTimeout(() => {
      showAlert({
        title: 'Reset Free Tier',
        message: 'App reverted to Free plan (Max 2 prescriptions).',
        type: 'info',
      });
    }, 350);
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

          {/* DYNAMIC SERVER PRICING OPTIONS */}
          {fetchingPackages ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={THEME.colors.primary} />
              <Text style={styles.loadingBoxText}>Loading live pricing from RevenueCat...</Text>
            </View>
          ) : packages.length > 0 ? (
            <View style={styles.packagesContainer}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const pkgTitle = pkg.product?.title || (pkg.identifier === '$rc_monthly' ? 'Monthly Pro Plan' : 'CareBridge Pro');
                const pkgPrice = pkg.product?.priceString || '$4.99';
                const pkgSub = pkg.product?.description || 'Unlimited punch-cards, PDF export & family alerts';

                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.pricingBox,
                      isSelected && styles.pricingBoxSelected,
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pricingLeft}>
                      <View style={styles.planHeaderRow}>
                        <Text style={styles.pricingTitle}>{pkgTitle}</Text>
                        {pkg.identifier === '$rc_monthly' && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>POPULAR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.pricingSub}>{pkgSub}</Text>
                    </View>
                    <Text style={styles.priceTag}>{pkgPrice}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.pricingBox}>
              <View style={styles.pricingLeft}>
                <Text style={styles.pricingTitle}>Pro Monthly Plan</Text>
                <Text style={styles.pricingSub}>7-Day Free Trial, then $4.99/mo</Text>
              </View>
              <Text style={styles.priceTag}>$4.99</Text>
            </View>
          )}

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

          {/* DEMO BYPASS FOR EVALUATORS & EXPO GO TESTING */}
          <TouchableOpacity
            style={styles.demoUnlockBtn}
            onPress={handleDemoUnlock}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={15} color="#0284C7" />
            <Text style={styles.demoUnlockBtnText}>[Demo] Instant Unlock Pro (Bypass Store)</Text>
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
  packagesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  loadingBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  loadingBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
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
  pricingBoxSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#EFF6FF',
    borderWidth: 2.5,
  },
  pricingLeft: {
    flex: 1,
    marginRight: 10,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
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
  demoUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    height: 48,
    borderRadius: 14,
    marginTop: 12,
  },
  demoUnlockBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.3,
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
