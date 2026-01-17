import React, { useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface BreathingGradientConfig {
  colors?: [string, string];
  speed?: number;
  intensity?: number;
}

const DEFAULT_CONFIG: Required<BreathingGradientConfig> = {
  colors: ["#F97316", "#FB923C"], // Orange tones
  speed: 3000,
  intensity: 0.2,
};

interface BreathingGradientProps {
  config?: BreathingGradientConfig;
}

/**
 * Smooth breathing gradient effect for processing screens.
 * Creates a calming, rhythmic color shift that indicates activity.
 */
export function BreathingGradient({ config }: BreathingGradientProps) {
  const mergedConfig: Required<BreathingGradientConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: mergedConfig.speed,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [mergedConfig.speed]);

  // Top-right blob animation
  const blob1Style = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 1.2]);
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [mergedConfig.intensity * 0.6, mergedConfig.intensity, mergedConfig.intensity * 0.6]
    );
    const translateX = interpolate(progress.value, [0, 1], [0, 15]);
    const translateY = interpolate(progress.value, [0, 1], [0, -10]);

    return {
      opacity,
      transform: [{ scale }, { translateX }, { translateY }],
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [mergedConfig.colors[0], mergedConfig.colors[1]]
      ),
    };
  });

  // Bottom-left blob animation (offset timing)
  const blob2Style = useAnimatedStyle(() => {
    const offsetProgress = (progress.value + 0.5) % 1;
    const scale = interpolate(offsetProgress, [0, 1], [1, 1.15]);
    const opacity = interpolate(
      offsetProgress,
      [0, 0.5, 1],
      [mergedConfig.intensity * 0.4, mergedConfig.intensity * 0.8, mergedConfig.intensity * 0.4]
    );
    const translateX = interpolate(offsetProgress, [0, 1], [0, -10]);
    const translateY = interpolate(offsetProgress, [0, 1], [0, 10]);

    return {
      opacity,
      transform: [{ scale }, { translateX }, { translateY }],
      backgroundColor: interpolateColor(
        offsetProgress,
        [0, 1],
        [mergedConfig.colors[1], mergedConfig.colors[0]]
      ),
    };
  });

  // Center subtle glow
  const centerGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.02, 0.06, 0.02]
    );
    const scale = interpolate(progress.value, [0, 1], [0.9, 1.1]);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <>
      {/* Top-right breathing blob */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          blob1Style,
        ]}
        pointerEvents="none"
      />

      {/* Bottom-left breathing blob */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          blob2Style,
        ]}
        pointerEvents="none"
      />

      {/* Center subtle glow */}
      <Animated.View
        style={[
          styles.centerGlow,
          { backgroundColor: mergedConfig.colors[0] },
          centerGlowStyle,
        ]}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 9999,
  },
  blob1: {
    top: -SCREEN_HEIGHT * 0.15,
    right: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
  },
  blob2: {
    bottom: -SCREEN_HEIGHT * 0.1,
    left: -SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
  centerGlow: {
    position: "absolute",
    top: "30%",
    left: "20%",
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 9999,
  },
});
