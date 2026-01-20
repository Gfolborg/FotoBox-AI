import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import {
  Colors,
  BorderRadius,
  Glassmorphism,
  Spacing,
} from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "solid" | "subtle";
  theme?: "light" | "dark";
  intensity?: number;
  padding?: keyof typeof Spacing | number;
  borderRadius?: keyof typeof BorderRadius | number;
}

export function GlassCard({
  children,
  style,
  variant = "default",
  theme = "light",
  intensity = 40,
  padding = "lg",
  borderRadius = "xl",
}: GlassCardProps) {
  const glassStyle = Glassmorphism[theme];
  const variantStyle =
    variant === "solid"
      ? glassStyle.cardSolid
      : variant === "subtle"
        ? glassStyle.cardSubtle
        : glassStyle.card;

  const paddingValue = typeof padding === "number" ? padding : Spacing[padding];
  const borderRadiusValue =
    typeof borderRadius === "number"
      ? borderRadius
      : BorderRadius[borderRadius];

  return (
    <View
      style={[styles.container, { borderRadius: borderRadiusValue }, style]}
    >
      <BlurView
        intensity={intensity}
        tint={theme === "dark" ? "dark" : "light"}
        style={[styles.blur, { borderRadius: borderRadiusValue }]}
      />
      <View
        style={[
          styles.content,
          variantStyle,
          {
            padding: paddingValue,
            borderRadius: borderRadiusValue,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    overflow: "hidden",
  },
});
