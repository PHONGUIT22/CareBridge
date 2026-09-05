import { RevenueCatService } from './revenuecat';

// 1. Safe dynamic require: Avoid crash when testing on Expo Go
let GoogleMobileAds: any = null;
try {
  GoogleMobileAds = require('react-native-google-mobile-ads');
} catch (error) {
  // Expo Go does not have native module; falls back to mock mode
}

const RewardedAd = GoogleMobileAds?.RewardedAd;
const RewardedAdEventType = GoogleMobileAds?.RewardedAdEventType;
const AdEventType = GoogleMobileAds?.AdEventType;
const TestIds = GoogleMobileAds?.TestIds;

// Use Test ID for stable testing
const AD_UNIT_ID = TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917';

class AdmobService {
  private rewardedAd: any = null;
  private isLoaded = false;
  private hasTrackedRevenueForCurrentAd = false;

  init() {
    // When running on Expo Go, avoid initializing native ads
    if (!RewardedAd) {
      console.log('[AdMob] Running on Expo Go: Switching to mock mode for UI testing');
      return;
    }
    this.loadNewAd();
  }

  loadNewAd() {
    if (!RewardedAd) return;

    this.hasTrackedRevenueForCurrentAd = false;
    try {
      this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.isLoaded = true;
      });

      // 1. If real ad triggers PAID event
      this.rewardedAd.addAdEventListener(AdEventType.PAID, (adValue: any) => {
        const realRevenue = (adValue?.value || 0) / 1_000_000;
        const revenueToTrack = realRevenue > 0 ? realRevenue : 0.02;

        RevenueCatService.trackAdImpression('AdMob', 'rewarded_ad', revenueToTrack);
        this.hasTrackedRevenueForCurrentAd = true;
      });

      this.rewardedAd.load();
    } catch (err) {
      console.log('[AdMob load error]:', err);
    }
  }

  showRewardedAd(placement: string, onRewardCallback: () => void) {
    // 2. Mock Mode for Expo Go / when ad has not finished loading:
    // Trigger ad impression tracking and invoke callback immediately
    if (!RewardedAd || !this.rewardedAd || !this.isLoaded) {
      console.log(`[Mock Mode] Bỏ qua ad cho "${placement}", mở tính năng ngay`);
      RevenueCatService.trackAdImpression('AdMob', placement, 0.02);
      onRewardCallback();
      if (RewardedAd) this.loadNewAd();
      return;
    }

    let earned = false;

    const rewardListener = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
        if (!this.hasTrackedRevenueForCurrentAd) {
          RevenueCatService.trackAdImpression('AdMob', placement, 0.02);
          this.hasTrackedRevenueForCurrentAd = true;
        }
        onRewardCallback();
      }
    );

    const closeListener = this.rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        this.isLoaded = false;
        rewardListener();
        closeListener();
        this.loadNewAd();
      }
    );

    this.rewardedAd.show();
  }
}

export const AdService = new AdmobService();