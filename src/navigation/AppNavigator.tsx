import React, { useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';
import { MedicineManagerScreen } from '../screens/MedicineManagerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { DeskModeScreen } from '../screens/DeskModeScreen';
import { EditorialHeroScreen } from '../screens/EditorialHeroScreen';
import { AuthWelcomeScreen } from '../screens/AuthWelcomeScreen';
import { useFlexMode } from '../hooks/useFlexMode';
import { Feather, Ionicons } from '@expo/vector-icons';

export type RootTabParamList = {
  Today: undefined;
  History: undefined;
  Analytics: undefined;
  DeskMode: undefined; // <-- Hands-free desk clock tab
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const AppNavigator: React.FC = () => {
  const [hasSeenHero, setHasSeenHero] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isFlexMode } = useFlexMode();

  // 1. Editorial Welcome Hero Screen (PawBloom aesthetic)
  if (!hasSeenHero) {
    return <EditorialHeroScreen onGetStarted={() => setHasSeenHero(true)} />;
  }

  // 2. Caregiver Portal / Sign In & Guest Access Screen
  if (!isAuthenticated) {
    return (
      <AuthWelcomeScreen
        onAuthenticate={() => setIsAuthenticated(true)}
        onContinue={() => setIsAuthenticated(true)}
      />
    );
  }

  // 3. Automatically enlarge clock when folded 90 degrees or in landscape mode
  if (isFlexMode) {
    return (
      <View style={styles.flexContainer}>
        <DeskModeScreen />
      </View>
    );
  }

  // 2. Standard 3-tab layout
  return (
    <Tab.Navigator
      initialRouteName="Today"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.light.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* TAB 1: TODAY SCHEDULE */}
      <Tab.Screen
        name="Today"
        component={MedicineManagerScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, focused }: { color: string; size: number; focused: boolean }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* TAB 2: HABITBOX PUNCH-CARD HISTORY */}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History Matrix',
          tabBarIcon: ({ color, focused }: { color: string; size: number; focused: boolean }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* TAB 3: VITALS ANALYTICS */}
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }: { color: string; size: number; focused: boolean }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />

      {/* TAB 4: NIGHTSTAND DESK CLOCK */}
      <Tab.Screen
        name="DeskMode"
        component={DeskModeScreen}
        options={{
          tabBarLabel: 'Desk Clock',
          tabBarIcon: ({ color, focused }: { color: string; size: number; focused: boolean }) => (
            <Ionicons
              name={focused ? 'alarm' : 'alarm-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: THEME.dark.background,
  },
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: Platform.OS === 'ios' ? 72 : 68,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});