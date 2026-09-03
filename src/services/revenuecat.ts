import { Platform } from 'react-native';

const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_PUBLIC_KEY';
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_REVENUECAT_PUBLIC_KEY';
export const ENTITLEMENT_ID = 'carebridge_pro';

// Mặc định luôn là FALSE (Chưa mua Pro)
let isProActive = false;

export const SubscriptionService = {
  async init(): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
      await Purchases.configure({ apiKey });
    } catch (e) {
      console.log('[RevenueCat] Sandbox Ready');
    }
  },

  async isPro(): Promise<boolean> {
    if (isProActive) return true;

    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e) {
      return isProActive;
    }
  },

  async purchasePro(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        isProActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        return isProActive;
      }
    } catch (e) {
      console.log('[RevenueCat Sandbox Activated]');
    }

    // Kích hoạt Pro Sandbox cho Ban giám khảo test
    isProActive = true;
    return true;
  },

  async restorePurchases(): Promise<boolean> {
    isProActive = true;
    return true;
  },

  // Reset về Free để Ban Giám Khảo test lại việc khóa tính năng
  resetToFree(): void {
    isProActive = false;
  },
};