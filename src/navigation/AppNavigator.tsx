import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';
import { MedicineManagerScreen } from '../screens/MedicineManagerScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DeskModeScreen } from '../screens/DeskModeScreen';
import { useFlexMode } from '../hooks/useFlexMode';
import { Feather, Ionicons } from '@expo/vector-icons';

export type RootTabParamList = {
  Today: undefined;
  History: undefined;
  DeskMode: undefined; // <-- Tab Đồng hồ rảnh tay
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const AppNavigator: React.FC = () => {
  const { isFlexMode } = useFlexMode();

  // 1. TỰ ĐỘNG PHÓNG TO ĐỒNG HỒ KHI GẬP MÁY 90 ĐỘ HOẶC XOAY NGANG
  if (isFlexMode) {
    return (
      <View style={styles.flexContainer}>
        <DeskModeScreen />
      </View>
    );
  }

  // 2. GIAO DIỆN CHUẨN 3 TAB ĐẦY ĐỦ
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
      {/* TAB 1: LỊCH HÔM NAY */}
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

      {/* TAB 2: LỊCH SỬ ĐỤC LỖ HABITBOX */}
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

      {/* TAB 3: ĐỒNG HỒ RẢNH TAY BÀN ĐÊM */}
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