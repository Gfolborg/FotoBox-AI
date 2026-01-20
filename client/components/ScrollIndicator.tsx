import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "@/constants/theme";

interface ScrollIndicatorProps {
  direction?: "left" | "right" | "down" | "up";
  show?: boolean;
  delay?: number;
}

export function ScrollIndicator({
  direction = "right",
  show = true,
  delay = 500,
}: ScrollIndicatorProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (show) {
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(0.8, { duration: 300 }),
          withRepeat(
            withSequence(
              withTiming(0.8, { duration: 800 }),
              withTiming(0.3, { duration: 800 }),
            ),
            3,
            false,
          ),
          withTiming(0, { duration: 500 }),
        ),
      );

      const movement = direction === "left" || direction === "up" ? -5 : 5;
      const isHorizontal = direction === "left" || direction === "right";

      if (isHorizontal) {
        translateX.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(movement, { duration: 400 }),
              withTiming(0, { duration: 400 }),
            ),
            6,
            false,
          ),
        );
      } else {
        translateY.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(movement, { duration: 400 }),
              withTiming(0, { duration: 400 }),
            ),
            6,
            false,
          ),
        );
      }
    } else {
      opacity.value = 0;
    }
  }, [show, delay, direction, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const iconName =
    direction === "left"
      ? "chevron-left"
      : direction === "right"
        ? "chevron-right"
        : direction === "up"
          ? "chevron-up"
          : "chevron-down";

  const positionStyle =
    direction === "left"
      ? styles.left
      : direction === "right"
        ? styles.right
        : direction === "up"
          ? styles.top
          : styles.bottom;

  return (
    <Animated.View style={[styles.container, positionStyle, animatedStyle]}>
      <View style={styles.iconContainer}>
        <Feather name={iconName} size={20} color={Colors.editing.text} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 10,
    pointerEvents: "none",
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: Spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  left: {
    left: Spacing.xs,
    top: "50%",
    marginTop: -16,
  },
  right: {
    right: Spacing.xs,
    top: "50%",
    marginTop: -16,
  },
  top: {
    top: Spacing.xs,
    left: "50%",
    marginLeft: -16,
  },
  bottom: {
    bottom: Spacing.xs,
    left: "50%",
    marginLeft: -16,
  },
});
