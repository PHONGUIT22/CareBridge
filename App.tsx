import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDB } from './src/database/db';
import { THEME } from './src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { RevenueCatService } from './src/services/revenuecat';

export default function App() {
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrapDatabase() {
      try {
        await Promise.all([
          initDB(),
          RevenueCatService.init(), // <-- Initialize RevenueCat on app startup
        ]);
        setIsDbReady(true);
      } catch (error) {
        console.error('Database bootstrap error:', error);
        setDbError('Failed to initialize local storage.');
      }
    }

    bootstrapDatabase();
  }, []);

  // Display high-contrast loading screen while database sets up
  if (!isDbReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
        <View style={styles.iconCircle}>
          <Ionicons name="medical" size={48} color={THEME.colors.primary} />
        </View>
        <Text style={styles.appTitle}>CareBridge</Text>
        <Text style={styles.appSubtitle}>Senior Medication Assistant</Text>

        {dbError ? (
          <Text style={styles.errorText}>{dbError}</Text>
        ) : (
          <ActivityIndicator
            size="large"
            color={THEME.colors.primary}
            style={styles.spinner}
          />
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={THEME.colors.background} />
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: THEME.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: THEME.colors.border,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  spinner: {
    marginTop: 36,
  },
  errorText: {
    fontSize: THEME.fontSizes.sm,
    fontWeight: '600',
    color: THEME.colors.statusSkipped,
    marginTop: 20,
    textAlign: 'center',
  },
});