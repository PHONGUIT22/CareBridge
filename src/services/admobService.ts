import { RevenueCatService } from './revenuecat';

// 1. Dynamic require an toàn: Tránh văng crash khi test trên Expo Go
let GoogleMobileAds: any = null;
try {
  GoogleMobileAds = require('react-native-google-mobile-ads');
} catch (error) {
  // Expo Go không có native module sẽ lọt vào đây và tự chạy mock
}

const RewardedAd = GoogleMobileAds?.RewardedAd;
const RewardedAdEventType = GoogleMobileAds?.RewardedAdEventType;
const AdEventType = GoogleMobileAds?.AdEventType;
const TestIds = GoogleMobileAds?.TestIds;

// Dùng Test ID để kiểm thử ổn định
const AD_UNIT_ID = TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917';

class AdmobService {
  private rewardedAd: any = null;
  private isLoaded = false;
  private hasTrackedRevenueForCurrentAd = false;

  init() {
    // Nếu chạy trên Expo Go, không khởi tạo native ad để tránh lỗi
    if (!RewardedAd) {
      console.log('[AdMob] Đang chạy Expo Go: Chuyển sang chế độ mock để test UI');
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

      // 1. Nếu quảng cáo thật kích hoạt PAID event
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
    // 2. Chế độ Mock cho Expo Go / Khi chưa load kịp Ad:
    // Tự động bỏ qua quảng cáo, kích hoạt ngay callback để mày bấm nút test UI mượt mà
    if (!RewardedAd || !this.rewardedAd || !this.isLoaded) {
      console.log(`[Mock Mode] Bỏ qua ad cho "${placement}", mở tính năng ngay`);
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