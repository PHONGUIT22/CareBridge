import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { RevenueCatService } from './revenuecat';

// Use Test ID so that test ads reliably appear for evaluation
const AD_UNIT_ID = TestIds.REWARDED;

class AdmobService {
  private rewardedAd: RewardedAd | null = null;
  private isLoaded = false;
  private hasTrackedRevenueForCurrentAd = false;

  init() {
    this.loadNewAd();
  }

  loadNewAd() {
    this.hasTrackedRevenueForCurrentAd = false;
    this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isLoaded = true;
    });

    // 1. If real ad triggers PAID event
    this.rewardedAd.addAdEventListener(AdEventType.PAID, (adValue: any) => {
      const realRevenue = (adValue?.value || 0) / 1_000_000;
      // Default fallback eCPM $0.02 if test ad returns 0 so RevenueCat dashboard has data
      const revenueToTrack = realRevenue > 0 ? realRevenue : 0.02;

      RevenueCatService.trackAdImpression('AdMob', 'rewarded_ad', revenueToTrack);
      this.hasTrackedRevenueForCurrentAd = true;
    });

    this.rewardedAd.load();
  }

  showRewardedAd(placement: string, onRewardCallback: () => void) {
    if (!this.rewardedAd || !this.isLoaded) {
      onRewardCallback();
      this.loadNewAd();
      return;
    }

    let earned = false;

    const rewardListener = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
        // 2. Fallback: If test ad does not trigger PAID, track data to RevenueCat upon earning reward
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
