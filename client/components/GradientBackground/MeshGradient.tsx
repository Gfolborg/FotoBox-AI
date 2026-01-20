import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";
import { MeshGradientConfig } from "./types";

const DEFAULT_CONFIG: Required<MeshGradientConfig> = {
  colors: [Colors.light.primary, Colors.light.secondary, "#FFF7ED"],
  intensity: 0.4,
  animated: true,
};

interface MeshGradientProps {
  config?: MeshGradientConfig;
}

/**
 * Animated mesh gradient using layered views with animated opacity.
 * This is a simpler, more compatible alternative to Skia shaders.
 */
export function MeshGradient({ config }: MeshGradientProps) {
  const mergedConfig: Required<MeshGradientConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const progress = useSharedValue(0);

  useEffect(() => {
    if (mergedConfig.animated) {
      progress.value = withRepeat(
        withTiming(1, {
          duration: 12000,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
    }
  }, [mergedConfig.animated]);

  const layer1Style = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.3, 0.5, 0.3]);
    const translateX = interpolate(progress.value, [0, 1], [-20, 20]);
    const translateY = interpolate(progress.value, [0, 1], [-10, 10]);
    return {
      opacity,
      transform: [{ translateX }, { translateY }],
    };
  });

  const layer2Style = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.25, 0.4, 0.25]);
    const translateX = interpolate(progress.value, [0, 1], [15, -15]);
    const translateY = interpolate(progress.value, [0, 1], [10, -10]);
    return {
      opacity,
      transform: [{ translateX }, { translateY }],
    };
  });

  const layer3Style = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.2, 0.35, 0.2]);
    return { opacity };
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Base warm layer */}
      <View
        style={[
          styles.layer,
          { backgroundColor: mergedConfig.colors[2] || "#FFF7ED" },
        ]}
      />

      {/* Animated color blobs */}
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { backgroundColor: mergedConfig.colors[0] },
          layer1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { backgroundColor: mergedConfig.colors[1] },
          layer2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          { backgroundColor: mergedConfig.colors[0] },
          layer3Style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: "absolute",
    borderRadius: 9999,
  },
  blob1: {
    top: "-20%",
    right: "-10%",
    width: "80%",
    height: "50%",
  },
  blob2: {
    bottom: "-10%",
    left: "-20%",
    width: "70%",
    height: "45%",
  },
  blob3: {
    top: "30%",
    right: "20%",
    width: "50%",
    height: "35%",
  },
});
