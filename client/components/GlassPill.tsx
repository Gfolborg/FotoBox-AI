import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

interface GlassPillProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  horizontal?: boolean;
}

export function GlassPill({
  children,
  style,
  intensity = 40,
  horizontal = true,
}: GlassPillProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={styles.blur} />
      <View
        style={[
          styles.content,
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
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
