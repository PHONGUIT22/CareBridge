import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface EditorialHeroProps {
  onGetStarted: () => void;
}

export const EditorialHeroScreen: React.FC<EditorialHeroProps> = ({ onGetStarted }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* LIFESTYLE BACKGROUND IMAGE WITH WARM SUNLIGHT */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
        }}
        style={styles.bgImage}
      >
        {/* CINEMATIC DARK OVERLAY FOR TEXT READABILITY */}
        <View style={styles.overlay}>
          <SafeAreaView style={styles.contentWrapper}>
            {/* TOP HEADER SECTION */}
            <View style={styles.topSection}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>SENIOR CARE • VITALS • MEDICATION</Text>
              </View>
              <Text style={styles.heroHeadline}>
                Peace of mind,{'\n'}for the ones{'\n'}who raised you.
              </Text>
            </View>

            {/* BOTTOM FOOTER SECTION */}
            <View style={styles.bottomSection}>
              <View style={styles.featurePillsRow}>
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>Offline SQLite</Text>
                </View>
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>Galaxy Fold Ready</Text>
                </View>
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>Doctor PDF</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryCta}
                onPress={onGetStarted}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryCtaText}>Open Caregiver Portal</Text>
                <Feather name="arrow-right" size={20} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.subHint}>HIPAA-aware • No external tracking required</Text>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)', // Dark cinematic overlay
    justifyContent: 'space-between',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 26,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 24 : 40,
    paddingBottom: 28,
  },
  topSection: {
    marginTop: 10,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryPillText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroHeadline: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  bottomSection: {
    width: '100%',
  },
  featurePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  miniTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  miniTagText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryCta: {
    backgroundColor: '#FFFFFF',
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryCtaText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subHint: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
});
