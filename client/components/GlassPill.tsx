import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface GlassPillProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  horizontal?: boolean;
  variant?: "light" | "dark";
}

export function GlassPill({
  children,
  style,
  intensity = 40,
  horizontal = true,
  variant = "light",
}: GlassPillProps) {
  const isDark = variant === "dark";

  return (
    <View style={[styles.container, isDark && styles.containerDark, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        style={styles.blur}
      />
      <View
        style={[
          styles.content,
          isDark && styles.contentDark,
          horizontal ? styles.horizontal : styles.vertical,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius["3xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  containerDark: {
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  contentDark: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  horizontal: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  vertical: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
