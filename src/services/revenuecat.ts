import { Platform } from 'react-native';

const API_KEYS = {
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'goog_ljnYRHEnlYgxgoPbHMzpJbgpBkr',
  testOrIos: process.env.EXPO_PUBLIC_RC_TEST_KEY || 'test_NBVokGjAXCxzSkUOhtioMYGEFLL',
};

const REVENUECAT_PUBLIC_API_KEY =
  Platform.OS === 'android' ? API_KEYS.android : API_KEYS.testOrIos;

export const ENTITLEMENT_ID = 'carebridge_pro';

export const RevenueCatService = {
  /**
   * 1. Khởi tạo Purchases SDK
   */
  async init(): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.setLogLevel(Purchases.LOG_LEVEL?.DEBUG || 0);
      await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_API_KEY });
      console.log('[RevenueCat] SDK Initialized successfully');
    } catch (e: any) {
      console.log('[RevenueCat Init Warning]:', e?.message || e);
    }
  },

  /**
   * 2. Track Ads an toàn qua AdTracker của SDK (Không dùng REST API)
   */
  async trackAdImpression(networkName: string, adUnitId: string, revenue: number): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;

      // Nếu react-native-purchases hỗ trợ adTracker (v10.2.0+)
      if (Purchases.adTracker?.trackAdRevenue) {
        await Purchases.adTracker.trackAdRevenue({
          networkName: networkName || 'Google AdMob',
          mediatorName: 'admob',
          adFormat: 'rewarded',
          placement: adUnitId || 'rewarded_ad',
          adUnitId: adUnitId || 'test_unit',
          impressionId: `imp_${Date.now()}`,
          revenueMicros: Math.round((revenue > 0 ? revenue : 0.02) * 1_000_000),
          currency: 'USD',
          precision: 1, // ESTIMATED
        });
        console.log(`[RevenueCat AdTracker] Tracked ${adUnitId} ($${revenue})`);
      } else {
        // Fallback lưu vết qua Subscriber Attributes cho các phiên bản SDK thông thường
        await Purchases.setAttributes({
          last_ad_watched: adUnitId,
          last_ad_network: networkName,
          ad_watch_timestamp: new Date().toISOString(),
        });
        console.log(`[RevenueCat Telemetry] Ad recorded: ${adUnitId}`);
      }
    } catch (error) {
      console.log('[RevenueCat Ad Track Note]:', error);
    }
  },

  /**
   * 3. Kiểm tra trạng thái Pro
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
   * 4. Kích hoạt mua gói Pro (Hỗ trợ Test Store của RevenueCat)
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
        console.error('[RevenueCat Purchase Error]', e);
      }
      return false;
    }
  },

  /**
   * 5. Khôi phục giao dịch
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.restorePurchases();
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e: any) {
      return false;
    }
  },

  resetToFree(): void {},
};

export const SubscriptionService = RevenueCatService;