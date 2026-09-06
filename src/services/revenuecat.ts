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
   * 1. Initialize Purchases SDK
   */
  async init(): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.setLogLevel(Purchases.LOG_LEVEL?.DEBUG || 0);
      await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_API_KEY });
      console.log('[RevenueCat] SDK Initialized with Key:', REVENUECAT_PUBLIC_API_KEY);
    } catch (e: any) {
      console.log('[RevenueCat Init Warning]:', e?.message || e);
    }
  },

  /**
   * 2. Fetch packages from default offering on server
   */
  async getPackages(): Promise<any[]> {
    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.log('[RevenueCat Offerings Error]:', e);
      return [];
    }
  },

  /**
   * 3. Track Ads telemetry
   */
  async trackAdImpression(networkName: string, adUnitId: string, revenue: number): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;

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
          precision: 1,
        });
      } else {
        await Purchases.setAttributes({
          last_ad_watched: adUnitId,
          last_ad_network: networkName,
          ad_watch_timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log('[RevenueCat Ad Track Note]:', error);
    }
  },

  /**
   * 4. Check real Pro status from SDK local cache
   */
  async isPro(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.getCustomerInfo();
      return Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
    } catch (e) {
      return false;
    }
  },

  /**
   * 5. Purchase specified package or default package
   */
  async purchasePro(pkgToBuy?: any): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      let targetPkg = pkgToBuy;

      if (!targetPkg) {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          targetPkg = offerings.current.availablePackages[0];
        }
      }

      if (!targetPkg) {
        throw new Error('No available package found');
      }

      const { customerInfo } = await Purchases.purchasePackage(targetPkg);
      return Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[RevenueCat Purchase Error]', e);
      }
      return false;
    }
  },

  /**
   * 6. Restore purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const Purchases = require('react-native-purchases').default;
      const customerInfo = await Purchases.restorePurchases();
      return Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
    } catch (e) {
      return false;
    }
  },

  /**
   * 7. Reset to Free tier by logging in with fresh guest ID
   */
  async resetToFree(): Promise<void> {
    try {
      const Purchases = require('react-native-purchases').default;
      const resetId = `demo_guest_${Date.now()}`;
      await Purchases.logIn(resetId);
      console.log('[RevenueCat] Reset to clean guest user:', resetId);
    } catch (e) {
      console.log('[RevenueCat Reset Error]:', e);
    }
  },
};

export const SubscriptionService = RevenueCatService;