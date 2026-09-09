import React, { useRef, useCallback } from 'react';
import { StyleSheet, Animated, StyleProp, ViewStyle, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface AnimatedScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedScreenWrapper: React.FC<AnimatedScreenWrapperProps> = ({ children, style }) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(8)).current;

  useFocusEffect(
    useCallback(() => {
      // Reset values to initial off-screen / transparent state
      opacityAnim.setValue(0);
      translateYAnim.setValue(8);

      // Trigger gentle 60fps fade-in and subtle slide-up
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, [opacityAnim, translateYAnim])
  );

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
