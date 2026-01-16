import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { BorderRadius, Colors } from "@/constants/theme";

interface ShimmerPlaceholderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A shimmer/skeleton loading placeholder with animated gradient effect.
 * Uses Reanimated for smooth 60fps animations.
 */
export function ShimmerPlaceholder({
  width = "100%",
  height = 200,
  borderRadius = BorderRadius.lg,
  style,
}: ShimmerPlaceholderProps) {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite repeat
      false, // Don't reverse
    );
  }, [shimmerPosition]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerPosition.value, [0, 1], [-100, 100]);
    return {
      transform: [{ translateX: `${translateX}%` as unknown as number }],
    };
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
    </View>
  );
}

/**
 * Image-specific shimmer placeholder with aspect ratio support
 */
interface ImageShimmerProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function ImageShimmer({ size = 300, style }: ImageShimmerProps) {
  return (
    <View
      style={[
        styles.imageShimmerContainer,
        { width: size, height: size },
        style,
      ]}
    >
      <ShimmerPlaceholder
        width="100%"
        height="100%"
        borderRadius={BorderRadius.xl}
      />
      {/* Decorative elements */}
      <View style={styles.imageIconContainer}>
        <View style={styles.imageIcon} />
      </View>
    </View>
  );
}

/**
 * Processing state with pulsing animation and progress
 */
interface ProcessingPlaceholderProps {
  size?: number;
  progress?: number; // 0-100
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function ProcessingPlaceholder({
  size = 300,
  progress,
  label = "Processing...",
  style,
}: ProcessingPlaceholderProps) {
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // Reverse for pulse effect
    );
  }, [pulseValue]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseValue.value, [0, 1], [1, 1.02]);
    const opacity = interpolate(pulseValue.value, [0, 1], [0.7, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(pulseValue.value, [0, 1], [0.3, 0.6]);
    return { opacity };
  });

  return (
    <View
      style={[styles.processingContainer, { width: size, height: size }, style]}
    >
      {/* Glow effect */}
      <Animated.View style={[styles.processingGlow, glowStyle]} />

      {/* Main container */}
      <Animated.View style={[styles.processingInner, pulseStyle]}>
        <View style={styles.processingIconContainer}>
          <View style={styles.processingSpinner}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.spinnerDot,
                  {
                    transform: [
                      { rotate: `${i * 45}deg` },
                      { translateY: -12 },
                    ],
                    opacity: 0.3 + i * 0.1,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Progress bar */}
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Animated.Text style={styles.progressText}>
              {Math.round(progress)}%
            </Animated.Text>
          </View>
        )}

        {/* Label */}
        <Animated.Text style={styles.processingLabel}>{label}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.backgroundTertiary,
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    width: "50%",
  },
  imageShimmerContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  imageIconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  imageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
  },
  processingContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  processingGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xl,
    transform: [{ scale: 1.05 }],
  },
  processingInner: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  processingIconContainer: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  processingSpinner: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  progressContainer: {
    width: "60%",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  processingLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
});
