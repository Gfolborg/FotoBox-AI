import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { Colors } from "@/constants/theme";

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "subtle" | "warm";
}

/**
 * A layered background component that creates depth and visual interest
 * without using expo-linear-gradient (which can crash).
 *
 * Uses overlapping views with different colors/opacities to simulate gradients.
 */
export function GradientBackground({
  children,
  style,
  variant = "default",
}: GradientBackgroundProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "warm":
        return {
          topColor: "#FFF7ED", // Warmer cream
          circleOpacity: 0.1,
        };
      case "subtle":
        return {
          topColor: "#FEFDFB", // Very subtle warm
          circleOpacity: 0.05,
        };
      default:
        return {
          topColor: "#FFF7ED",
          circleOpacity: 0.08,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.container, style]}>
      {/* Background layers */}
      <View style={styles.backgroundLayer}>
        {/* Top warm tint */}
        <View
          style={[
            styles.bgGradientTop,
            { backgroundColor: variantStyles.topColor },
          ]}
        />
        {/* Bottom base color */}
        <View style={styles.bgGradientBottom} />
        {/* Decorative accent circles */}
        <View
          style={[
            styles.accentCircle1,
            { opacity: variantStyles.circleOpacity },
          ]}
        />
        <View
          style={[
            styles.accentCircle2,
            { opacity: variantStyles.circleOpacity * 0.6 },
          ]}
        />
      </View>
      {/* Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  bgGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: Colors.light.backgroundRoot,
  },
  accentCircle1: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.light.primary, // Coral
  },
  accentCircle2: {
    position: "absolute",
    bottom: 100,
    left: -120,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.light.primary, // Coral
  },
});
