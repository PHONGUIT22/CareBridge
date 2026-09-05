import React, { useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';
import { MedicineManagerScreen } from '../screens/MedicineManagerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DeskModeScreen } from '../screens/DeskModeScreen';
import { AuthWelcomeScreen } from '../screens/AuthWelcomeScreen';
import { useFlexMode } from '../hooks/useFlexMode';
import { Feather, Ionicons } from '@expo/vector-icons';

export type RootTabParamList = {
  Today: undefined;
  History: undefined;
  DeskMode: undefined; // <-- Hands-free desk clock tab
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isFlexMode } = useFlexMode();

  // 1. Render AuthWelcomeScreen if not yet authenticated
  if (!isAuthenticated) {
    return <AuthWelcomeScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  // 2. Automatically enlarge clock when folded 90 degrees or in landscape mode
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

      {/* TAB 3: NIGHTSTAND DESK CLOCK */}
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
    backgroundColor: THEME.light.surface,
    height: Platform.OS === 'ios' ? 90 : 76,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1.5,
    borderTopColor: THEME.light.borderLight,
    ...THEME.shadows.card,
  },
  tabBarLabel: {
    fontSize: THEME.fontSizes.xs,
    fontWeight: '800',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});