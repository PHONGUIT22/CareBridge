import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

export interface FlexModeState {
  isLandscape: boolean;
  isFlexMode: boolean; // True when phone is placed horizontally or folded in tent/stand mode
  width: number;
  height: number;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
}

export function useFlexMode(): FlexModeState {
  const { width, height } = useWindowDimensions();

  const [state, setState] = useState<FlexModeState>(() => {
    const isLandscape = width > height;
    return {
      isLandscape,
      isFlexMode: isLandscape,
      width,
      height,
      orientation: isLandscape ? 'LANDSCAPE' : 'PORTRAIT',
    };
  });

  useEffect(() => {
    const isLandscape = width > height;
    const aspectRatio = height / width;

    // Detects landscape orientation or square-like foldable half screens (Samsung Z Flip Flex Mode)
    const isFoldableHalf = aspectRatio <= 1.25 && aspectRatio >= 0.8;
    const activeFlexMode = isLandscape || isFoldableHalf;

    setState({
      isLandscape,
      isFlexMode: activeFlexMode,
      width,
      height,
      orientation: isLandscape ? 'LANDSCAPE' : 'PORTRAIT',
    });
  }, [width, height]);

  return state;
}