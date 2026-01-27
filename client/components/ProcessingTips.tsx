import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ProcessingTipsProps {
  tips: string[];
  style?: StyleProp<ViewStyle>;
  variant?: "light" | "dark";
}

export const DEFAULT_PROCESSING_TIPS = [
  "Center the product in the frame.",
  "Keep the background clean and clutter-free.",
  "Avoid other products in the shot.",
  "Leave a little space around the item.",
  "Portrait framing exports best for most platforms.",
  "Use even lighting to avoid harsh shadows.",
];

export function ProcessingTips({
  tips,
  style,
  variant = "light",
}: ProcessingTipsProps) {
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [maxTextWidth, setMaxTextWidth] = useState(0);
  const opacity = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    if (!tips.length) {
      setOrder([]);
      setIndex(0);
      return;
    }

    const indices = tips.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setOrder(indices);
    setIndex(0);
  }, [tips]);

  useEffect(() => {
    if (!tips.length) return;

    let cycleTimeout: ReturnType<typeof setTimeout> | null = null;
    let swapTimeout: ReturnType<typeof setTimeout> | null = null;

    opacity.value = withTiming(1, { duration: 300 });

    const cycle = () => {
      opacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      });

      swapTimeout = setTimeout(() => {
        setIndex((prev) => {
          const next = prev + 1;
          if (next >= tips.length) {
            const indices = tips.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i -= 1) {
              const j = Math.floor(Math.random() * (i + 1));
              [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            setOrder(indices);
            return 0;
          }
          return next;
        });
        opacity.value = withTiming(1, { duration: 300 });
      }, 260);

      cycleTimeout = setTimeout(cycle, 3200);
    };

    cycleTimeout = setTimeout(cycle, 3200);

    return () => {
      if (cycleTimeout) clearTimeout(cycleTimeout);
      if (swapTimeout) clearTimeout(swapTimeout);
    };
  }, [tips.length, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!tips.length) return null;
  const tipIndex = order[index] ?? index;
  const tip = tips[tipIndex] ?? tips[0];
  const pillWidth = useMemo(() => {
    if (!maxTextWidth) return undefined;
    const iconWidth = 22;
    const gap = Spacing.xs;
    const horizontalPadding = Spacing.md * 2;
    const rawWidth = maxTextWidth + iconWidth + gap + horizontalPadding;
    const maxWidth = screenWidth - Spacing.lg * 2;
    return Math.min(rawWidth, maxWidth);
  }, [maxTextWidth, screenWidth]);

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[styles.labelContainer, pillWidth ? { width: pillWidth } : null]}
      >
        <ThemedText
          style={[styles.label, variant === "dark" && styles.labelDark]}
        >
          Tips
        </ThemedText>
      </View>
      <Animated.View
        style={[
          styles.container,
          variant === "dark" && styles.containerDark,
          animatedStyle,
          pillWidth ? { width: pillWidth } : null,
        ]}
      >
        <View style={[styles.icon, variant === "dark" && styles.iconDark]}>
          <Feather
            name="info"
            size={14}
            color={variant === "dark" ? "#FFFFFF" : Colors.editing.primary}
          />
        </View>
        <ThemedText
          style={[styles.text, variant === "dark" && styles.textDark]}
        >
          {tip}
        </ThemedText>
      </Animated.View>

      <View style={styles.measureWrapper} pointerEvents="none">
        {tips.map((item) => (
          <ThemedText
            key={item}
            style={styles.text}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setMaxTextWidth((prev) => (width > prev ? width : prev));
            }}
          >
            {item}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  labelContainer: {
    alignSelf: "center",
  },
  label: {
    color: Colors.editing.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    alignSelf: "flex-start",
  },
  labelDark: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: Colors.editing.border,
    alignSelf: "center",
  },
  containerDark: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.editing.primarySubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDark: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  text: {
    color: Colors.editing.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  textDark: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  measureWrapper: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
    left: -9999,
  },
});
