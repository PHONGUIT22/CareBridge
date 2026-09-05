import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { THEME } from '../constants/theme';
import { CaregiverRepo } from '../database/caregiverRepo';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface AuthWelcomeScreenProps {
  onAuthenticate: () => void;
}

export const AuthWelcomeScreen: React.FC<AuthWelcomeScreenProps> = ({ onAuthenticate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle email sign-in
  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Please enter your caregiver email or continue without an account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Demo Email', onPress: () => { setEmail('caregiver.demo@carebridge.health'); } },
        ]
      );
      return;
    }

    setIsSubmitting(true);
    // Persist caregiver credentials to SQLite so Today screen and PDF reflect the user
    await CaregiverRepo.saveCaregiver(email.trim());

    setTimeout(() => {
      setIsSubmitting(false);
      onAuthenticate();
    }, 300);
  };

  // Handle guest caregiver sign-in (allows instant offline access)
  const handleGuestSignIn = async () => {
    await CaregiverRepo.saveCaregiver('', 'Family Caregiver');
    onAuthenticate();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.light.background} />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. BRAND HERO SECTION */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="heart-pulse" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>CareBridge</Text>
            <Text style={styles.brandSubtitle}>Senior Medication & Care Companion</Text>

            {/* Feature Pills */}
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Feather name="clock" size={13} color={THEME.colors.royalBlue} />
                <Text style={styles.pillText}>Smart Schedule</Text>
              </View>
              <View style={styles.pill}>
                <MaterialCommunityIcons name="heart-plus-outline" size={14} color="#0D9488" />
                <Text style={[styles.pillText, { color: '#0D9488' }]}>Vitals Audit</Text>
              </View>
              <View style={styles.pill}>
                <Feather name="file-text" size={13} color="#0284C7" />
                <Text style={[styles.pillText, { color: '#0284C7' }]}>Doctor PDF</Text>
              </View>
            </View>
          </View>

          {/* 2. AUTH FORM CARD */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Caregiver Portal</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to manage prescriptions, biometric vitals, and adherence reports.
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Caregiver Email</Text>
              <View style={styles.inputFieldWrapper}>
                <Feather name="mail" size={18} color={THEME.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. caregiver@carebridge.health"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input (Optional for convenience) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Passcode / PIN (Optional)</Text>
              <View style={styles.inputFieldWrapper}>
                <Feather name="lock" size={18} color={THEME.light.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Email Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Signing in...' : 'Sign In with Email'}
              </Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITHOUT ACCOUNT</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 3. GUEST CAREGIVER BUTTON (ONE-TAP IMMEDIATE ACCESS) */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestSignIn}
              activeOpacity={0.85}
            >
              <View style={styles.guestIconWrapper}>
                <MaterialCommunityIcons name="shield-account-outline" size={22} color={THEME.colors.primary} />
              </View>
              <View style={styles.guestTextContainer}>
                <Text style={styles.guestButtonTitle}>Continue as Guest Caregiver</Text>
                <Text style={styles.guestButtonSubtitle}>
                  Instant local access • No cloud account required
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={THEME.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* 4. FOOTER NOTE */}
          <View style={styles.footerContainer}>
            <View style={styles.securityBadge}>
              <Feather name="shield" size={13} color="#16A34A" />
              <Text style={styles.securityText}>Offline-First Local SQLite Storage • HIPAA Aware</Text>
            </View>
            <Text style={styles.versionText}>CareBridge v1.0 • Built for Seniors & Caregivers</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.light.background,
    // Safe padding to prevent camera punch-hole and status bar clipping on Android
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 30 : 20,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.royalBlue,
  },
  cardContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    ...THEME.shadows.card,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: THEME.colors.textPrimary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 14,
    height: 50,
    gap: 8,
    marginTop: 4,
    marginBottom: 18,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.borderLight,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    paddingHorizontal: 10,
    letterSpacing: 0.8,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 14,
  },
  guestIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guestTextContainer: {
    flex: 1,
  },
  guestButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginBottom: 2,
  },
  guestButtonSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.colors.textMuted,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16A34A',
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
