import { Platform } from 'react-native';

const API_KEYS = {
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'goog_ljnYRHEnlYgxgoPbHMzpJbgpBkr',
  testOrIos: process.env.EXPO_PUBLIC_RC_TEST_KEY || 'test_NBVokGjAXCxzSkUOhtioMYGEFLL',
};

// Khóa Secret Key vừa tạo để gọi REST API
const RC_SECRET_API_KEY =
  process.env.EXPO_PUBLIC_RC_SECRET_KEY || 'sk_DXHguvzBKcLnFVPawAYWPADrajCFU';

// Public key dùng cho SDK native
const REVENUECAT_PUBLIC_API_KEY =
  Platform.OS === 'android' ? API_KEYS.android : API_KEYS.testOrIos;

export const ENTITLEMENT_ID = 'carebridge_pro';

export const RevenueCatService = {
  /**
   * 1. Initialize RevenueCat SDK on app launch
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
   * 2. Track ad revenue data via RevenueCat REST API
   * Bắn trực tiếp dữ liệu Ad Revenue vào Customer History trên RevenueCat
   */
  async trackAdImpression(networkName: string, adUnitId: string, revenue: number): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.getCustomerInfo();
      const appUserId = customerInfo?.originalAppUserId || (await Purchases.getAppUserID?.());

      if (!appUserId) {
        console.log('[RevenueCat Track Error]: No appUserId found');
        return;
      }

      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/ad_revenue`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RC_SECRET_API_KEY}`,
          },
          body: JSON.stringify({
            use_source_date_provider: false,
            ad_revenue: [
              {
                network_name: (networkName || 'admob').toLowerCase(),
                ad_unit: adUnitId || 'rewarded_ad',
                revenue: revenue > 0 ? revenue : 0.02,
                currency: 'USD',
              },
            ],
          }),
        }
      );

      const responseText = await response.text();
      console.log(`[RevenueCat Ads Tracked]: Status ${response.status} -> ${responseText}`);
    } catch (error) {
      console.log('[RevenueCat Track Error]:', error);
    }
  },

  /**
   * 3. Check Pro subscription status
   */
  async isPro(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e) {
      return false;
    }
  },

  /**
   * 4. Purchase Pro entitlement
   */
  async purchasePro(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        const { customerInfo } = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      }
      return false;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[RevenueCat Error]', e);
      }
      return false;
    }
  },

  /**
   * 5. Restore Pro purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.restorePurchases();
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e: any) {
      console.error('[RevenueCat Restore Error]', e);
      return false;
    }
  },

  resetToFree(): void {},
};

export const SubscriptionService = RevenueCatService;