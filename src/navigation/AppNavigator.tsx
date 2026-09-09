import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Platform, View, TouchableOpacity, Animated } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';
import { MedicineManagerScreen } from '../screens/MedicineManagerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { DeskModeScreen } from '../screens/DeskModeScreen';
import { EditorialHeroScreen } from '../screens/EditorialHeroScreen';
import { AuthWelcomeScreen } from '../screens/AuthWelcomeScreen';
import { useFlexMode } from '../hooks/useFlexMode';
import { Ionicons } from '@expo/vector-icons';

export type RootTabParamList = {
  Today: undefined;
  History: undefined;
  Analytics: undefined;
  DeskMode: undefined; // <-- Hands-free desk clock tab
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const SeniorFriendlyTabButton: React.FC<BottomTabBarButtonProps> = (props: any) => {
  const focused = Boolean(props.accessibilityState?.selected);
  const scaleAnim = useRef(new Animated.Value(focused ? 1.06 : 1.0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.06 : 1.0,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  const handlePress = (e: any) => {
    Haptics.selectionAsync().catch(() => {});
    props.onPress?.(e);
  };

  const { delayLongPress, style, children, ...restProps } = props;
  return (
    <AnimatedTouchableOpacity
      {...restProps}
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        style,
        styles.tabBarButton,
        focused && styles.tabBarButtonFocused,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
};

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

  // 2. Standard senior-friendly 4-tab layout
  return (
    <Tab.Navigator
      initialRouteName="Today"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarButton: (props) => <SeniorFriendlyTabButton {...props} />,
      }}
    >
      {/* TAB 1: CAREGIVER SCHEDULE & MANAGEMENT */}
      <Tab.Screen
        name="Today"
        component={MedicineManagerScreen}
        options={{
          tabBarLabel: 'Caregiver',
          tabBarIcon: ({ color, focused }: { color: string; size: number; focused: boolean }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={25}
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
              size={26}
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
              size={26}
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
              size={26}
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
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 16,
    right: 16,
    height: Platform.OS === 'ios' ? 78 : 72,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBarButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginHorizontal: 3,
    marginVertical: 4,
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 4,
  },
  tabBarButtonFocused: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});