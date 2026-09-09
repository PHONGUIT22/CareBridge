import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

const API_KEYS = {
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || 'goog_ljnYRHEnlYgxgoPbHMzpJbgpBkr',
  testOrIos: process.env.EXPO_PUBLIC_RC_TEST_KEY || 'test_NBVokGjAXCxzSkUOhtioMYGEFLL',
};

const REVENUECAT_PUBLIC_API_KEY =
  Platform.OS === 'android' ? API_KEYS.android : API_KEYS.testOrIos;

export const ENTITLEMENT_ID = 'carebridge_pro';

// Local cached state and listeners for real-time entitlement synchronization
let isProCached: boolean = false;
type EntitlementListener = (isPro: boolean, customerInfo?: CustomerInfo) => void;
const entitlementListeners: Set<EntitlementListener> = new Set();

export const RevenueCatService = {
  /**
   * 1. Initialize Purchases SDK and register customer info listener
   */
  async init(): Promise<void> {
    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey: REVENUECAT_PUBLIC_API_KEY });
      console.log('[RevenueCat] SDK Initialized with Key:', REVENUECAT_PUBLIC_API_KEY);

      // Automatically sync entitlement state when customer info updates from server
      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        isProCached = Boolean(info?.entitlements?.active[ENTITLEMENT_ID]);
        console.log('[RevenueCat] Entitlement state updated automatically. Pro active:', isProCached);
        entitlementListeners.forEach((listener) => {
          try {
            listener(isProCached, info);
          } catch (err) {
            console.warn('[RevenueCat Listener Callback Error]:', err);
          }
        });
      });
    } catch (e: any) {
      console.log('[RevenueCat Init Warning]:', e?.message || e);
    }
  },

  /**
   * 2. Fetch packages from default offering on server
   */
  async getPackages(): Promise<PurchasesPackage[]> {
    try {
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
      if ((Purchases as any).adTracker?.trackAdRevenue) {
        await (Purchases as any).adTracker.trackAdRevenue({
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
   * 4. Check real Pro status from SDK local cache or manual demo override
   */
  async isPro(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const sdkPro = Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
      isProCached = isProCached || sdkPro;
      return isProCached;
    } catch (e) {
      return isProCached;
    }
  },

  /**
   * Set local Pro entitlement directly (ideal for Expo Go / Simulator demo testing without Store accounts)
   */
  setLocalPro(enabled: boolean): void {
    isProCached = enabled;
    console.log('[RevenueCat] Local entitlement override. Pro active:', isProCached);
    entitlementListeners.forEach((listener) => {
      try {
        listener(isProCached);
      } catch (err) {
        console.warn('[RevenueCat Listener Callback Error]:', err);
      }
    });
  },

  /**
   * Synchronous cached Pro status check
   */
  isProSync(): boolean {
    return isProCached;
  },

  /**
   * Subscribe to real-time Pro entitlement updates
   */
  subscribe(listener: EntitlementListener): () => void {
    entitlementListeners.add(listener);
    listener(isProCached);
    return () => {
      entitlementListeners.delete(listener);
    };
  },

  /**
   * 5. Purchase specified package or default package
   */
  async purchasePro(pkgToBuy?: PurchasesPackage): Promise<boolean> {
    try {
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
      const proActive = Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
      isProCached = proActive;
      return proActive;
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
      const customerInfo = await Purchases.restorePurchases();
      const proActive = Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
      isProCached = proActive;
      return proActive;
    } catch (e) {
      return false;
    }
  },

  /**
   * 7. Reset to Free tier by logging in with fresh guest ID
   */
  async resetToFree(): Promise<void> {
    isProCached = false;
    try {
      const resetId = `demo_guest_${Date.now()}`;
      const { customerInfo } = await Purchases.logIn(resetId);
      isProCached = Boolean(customerInfo?.entitlements?.active[ENTITLEMENT_ID]);
      console.log('[RevenueCat] Reset to clean guest user:', resetId);
    } catch (e) {
      console.log('[RevenueCat Reset Error]:', e);
    }
    entitlementListeners.forEach((listener) => {
      try {
        listener(isProCached);
      } catch (err) {
        console.warn('[RevenueCat Listener Callback Error]:', err);
      }
    });
  },
};

export const SubscriptionService = RevenueCatService;