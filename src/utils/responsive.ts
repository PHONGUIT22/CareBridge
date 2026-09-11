import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Standard viewport guideline base dimensions (iPhone X / standard mobile viewport)
export const guidelineBaseWidth = 375;
export const guidelineBaseHeight = 812;

/**
 * Scale horizontal size proportionally to the screen width.
 */
export const scale = (size: number): number => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scale vertical size proportionally to the screen height.
 */
export const verticalScale = (size: number): number => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Resize proportionally with a dampening factor (default 0.5)
 * to prevent oversized UI elements on tablets or foldables.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;
