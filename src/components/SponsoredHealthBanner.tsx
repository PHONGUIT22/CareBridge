import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { THEME } from '../constants/theme';
import { RevenueCatService } from '../services/revenuecat';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

interface SponsoredBannerProps {
  placement: 'history_footer' | 'desk_completed';
}

const SPONSORED_TIPS = [
  {
    title: 'Senior Health Partner: Omron',
    description: 'Check blood pressure at the same time daily for 99% clinical accuracy.',
    partner: 'Omron Healthcare',
    cpmRevenue: 0.015, // $0.015 USD
  },
  {
    title: 'Hydration Partner: Nestle Health',
    description: 'Drinking 1 glass of warm water before taking medication aids absorption.',
    partner: 'Pure Life Medical',
    cpmRevenue: 0.02,
  },
];

export const SponsoredHealthBanner: React.FC<SponsoredBannerProps> = ({ placement }) => {
  const [tip] = useState(() => SPONSORED_TIPS[placement === 'history_footer' ? 0 : 1]);

  useEffect(() => {
    // Automatically track ad impression to RevenueCat dashboard when banner is displayed
    RevenueCatService.trackAdImpression('AdMob', placement, tip.cpmRevenue);
  }, [placement, tip]);

  const handleLearnMore = () => {
    // Open trusted clinical health resource or track interaction impression
    RevenueCatService.trackAdImpression('AdMob_Click', `${placement}_interaction`, 0.05);
    Linking.openURL('https://www.cdc.gov/bloodpressure/index.htm').catch(() => {});
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="shield-check" size={14} color="#1E40AF" />
          <Text style={styles.badgeText}>SPONSORED HEALTH ADVICE</Text>
        </View>
        <Text style={styles.partnerName}>{tip.partner}</Text>
      </View>

      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.desc}>{tip.description}</Text>

      <TouchableOpacity style={styles.actionBtn} onPress={handleLearnMore} activeOpacity={0.8}>
        <Text style={styles.actionText}>Read Physician Guide</Text>
        <Feather name="external-link" size={14} color={THEME.colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.light.textMuted,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.light.textPrimary,
  },
  desc: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.light.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
});