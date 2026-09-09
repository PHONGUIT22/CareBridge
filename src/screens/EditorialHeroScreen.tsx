import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EditorialHeroProps {
  onGetStarted: () => void;
}

export const EditorialHeroScreen: React.FC<EditorialHeroProps> = ({ onGetStarted }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* BASE GRADIENT FALLBACK (Always visible offline or during 403) */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#0B1120']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* REMOTE LIFESTYLE BACKGROUND IMAGE WITH GRACEFUL ERROR HANDLING */}
      {!imageError && (
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
          }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}

      {/* CINEMATIC DARK OVERLAY FOR TEXT READABILITY */}
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.72)', 'rgba(15, 23, 42, 0.42)', 'rgba(15, 23, 42, 0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* HERO CONTENT */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
