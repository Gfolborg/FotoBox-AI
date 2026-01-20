import React, { useEffect } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";
import { PulsingGlowConfig } from "./types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DEFAULT_CONFIG: Required<PulsingGlowConfig> = {
  color: Colors.light.primary,
  intensity: 0.15,
  speed: 2000,
};

interface PulsingGlowProps {
  config?: PulsingGlowConfig;
}

export function PulsingGlow({ config }: PulsingGlowProps) {
  const mergedConfig: Required<PulsingGlowConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: mergedConfig.speed,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: mergedConfig.speed,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1, // infinite
      false,
    );
  }, [mergedConfig.speed]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pulse.value,
      [0, 1],
      [mergedConfig.intensity * 0.5, mergedConfig.intensity],
    );
    const scale = interpolate(pulse.value, [0, 1], [1, 1.15]);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <>
      {/* Primary glow - top right */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: mergedConfig.color,
            top: -SCREEN_HEIGHT * 0.2,
            right: -SCREEN_WIDTH * 0.3,
            width: SCREEN_WIDTH * 0.8,
            height: SCREEN_WIDTH * 0.8,
          },
          animatedStyle,
        ]}
        pointerEvents="none"
      />
      {/* Secondary glow - bottom left */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: mergedConfig.color,
            bottom: -SCREEN_HEIGHT * 0.1,
            left: -SCREEN_WIDTH * 0.4,
            width: SCREEN_WIDTH * 0.7,
            height: SCREEN_WIDTH * 0.7,
            opacity: mergedConfig.intensity * 0.5,
          },
          animatedStyle,
        ]}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    borderRadius: 9999,
  },
});
