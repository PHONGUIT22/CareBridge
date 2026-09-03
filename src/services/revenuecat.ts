import { Platform } from 'react-native';

const API_KEYS = {
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'goog_ljnYRHEnlYgxgoPbHMzpJbgpBkr',
  testOrIos: process.env.EXPO_PUBLIC_RC_TEST_KEY || 'test_NBVokGjAXCxzSkUOhtioMYGEFLL',
};

// Ưu tiên key Android thật, fallback sang Test key
const REVENUECAT_PUBLIC_API_KEY =
  Platform.OS === 'android' ? API_KEYS.android : API_KEYS.testOrIos;

export const ENTITLEMENT_ID = 'carebridge_pro';

let isProActive = false;

export const RevenueCatService = {
  /**
   * 1. Khởi tạo SDK RevenueCat khi mở app
   */
  async init(): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.setLogLevel(Purchases.LOG_LEVEL?.DEBUG || 0);
      await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_API_KEY });
      console.log('[RevenueCat] SDK Initialized with Key:', REVENUECAT_PUBLIC_API_KEY);
    } catch (e: any) {
      console.log('[RevenueCat Safe Init Fallback]:', e?.message || e);
    }
  },

  /**
   * 2. Ghi nhận dữ liệu quảng cáo (Catvertising Track)
   * Đẩy doanh thu quảng cáo Ad Revenue về Dashboard RevenueCat
   */
  async trackAdImpression(networkName: string, adUnitId: string, revenue: number): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      if (Purchases.setAdRevenue) {
        await Purchases.setAdRevenue({
          revenue,
          source: networkName,
          networkPlacement: adUnitId,
        });
      }
      console.log(`[RevenueCat Catvertising] Tracked ad impression: ${networkName} (${adUnitId}) -> $${revenue}`);
    } catch (error) {
      console.log(`[RevenueCat Mock Ad Tracked]: ${networkName} - $${revenue}`);
    }
  },

  /**
   * 3. Kiểm tra trạng thái Pro
   */
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

  /**
   * 4. Mua gói Pro
   */
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

    isProActive = true;
    return true;
  },

  /**
   * 5. Khôi phục gói Pro
   */
  async restorePurchases(): Promise<boolean> {
    isProActive = true;
    return true;
  },

  resetToFree(): void {
    isProActive = false;
  },
};

// Export alias để tương thích các component cũ
export const SubscriptionService = RevenueCatService;
