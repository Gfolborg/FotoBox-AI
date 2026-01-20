import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DIAL_WIDTH = SCREEN_WIDTH - 60; // Reduced from 80
const TICK_COUNT = 41; // Number of tick marks
const TICK_SPACING = DIAL_WIDTH / (TICK_COUNT - 1);

interface CircularDialProps {
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  label: string;
  formatValue?: (value: number) => string;
  onValueChange: (value: number) => void;
}

export function CircularDial({
  value,
  min,
  max,
  step,
  defaultValue,
  label,
  formatValue,
  onValueChange,
}: CircularDialProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Calculate the dial position based on value
  const valueRange = max - min;
  const normalizedValue = (value - min) / valueRange;
  const dialOffset = normalizedValue * DIAL_WIDTH - DIAL_WIDTH / 2;

  const updateValue = (newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    onValueChange(steppedValue);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = dialOffset;
    })
    .onUpdate((e) => {
      // Invert translation for intuitive control: drag right = dial moves left
      const newOffset = startX.value - e.translationX;
      const clampedOffset = Math.max(
        -DIAL_WIDTH / 2,
        Math.min(DIAL_WIDTH / 2, newOffset),
      );
      translateX.value = clampedOffset;

      // Convert offset to value
      const normalizedPos = (clampedOffset + DIAL_WIDTH / 2) / DIAL_WIDTH;
      const newValue = min + normalizedPos * valueRange;
      runOnJS(updateValue)(newValue);
    })
    .onEnd(() => {
      translateX.value = withSpring(dialOffset, {
        damping: 20,
        stiffness: 200,
      });
    });

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -dialOffset }],
  }));

  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);
  const isDefault = Math.abs(value - defaultValue) < step / 2;

  return (
    <View style={styles.container}>
      {/* Label and Value */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <ThemedText style={styles.label}>{label}</ThemedText>
        </View>
        <View
          style={[
            styles.valueContainer,
            !isDefault && styles.valueContainerActive,
          ]}
        >
          <ThemedText style={[styles.value, isDefault && styles.valueDefault]}>
            {displayValue}
          </ThemedText>
        </View>
      </View>

      {/* Dial */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.dialContainer}>
          {/* Center indicator */}
          <View style={styles.centerIndicator} />

          {/* Tick marks */}
          <Animated.View style={[styles.ticksContainer, dialStyle]}>
            {Array.from({ length: TICK_COUNT }).map((_, index) => {
              const tickValue = min + (index / (TICK_COUNT - 1)) * valueRange;
              const isCenter =
                Math.abs(tickValue - defaultValue) <
                valueRange / (TICK_COUNT - 1);
              const isMajor = index % 5 === 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.tick,
                    isMajor && styles.tickMajor,
                    isCenter && styles.tickCenter,
                  ]}
                />
              );
            })}
          </Animated.View>

          {/* Gradient overlays for fade effect */}
          <View style={[styles.gradientOverlay, styles.gradientLeft]} />
          <View style={[styles.gradientOverlay, styles.gradientRight]} />
        </View>
      </GestureDetector>

      {/* Min/Max labels */}
      <View style={styles.rangeLabels}>
        <ThemedText style={styles.rangeLabel}>
          {formatValue ? formatValue(min) : min}
        </ThemedText>
        <ThemedText style={styles.rangeLabel}>
          {formatValue ? formatValue(max) : max}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  labelContainer: {
    backgroundColor: Colors.editing.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.editing.text,
  },
  valueContainer: {
    backgroundColor: Colors.editing.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    minWidth: 80,
    alignItems: "center",
  },
  valueContainerActive: {
    backgroundColor: Colors.editing.primarySubtle,
    borderColor: Colors.editing.primary,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.editing.primary,
  },
  valueDefault: {
    color: Colors.editing.textSecondary,
  },
  dialContainer: {
    width: DIAL_WIDTH,
    height: 45,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  centerIndicator: {
    position: "absolute",
    width: 2,
    height: 30,
    backgroundColor: Colors.editing.primary,
    borderRadius: 2,
    zIndex: 10,
  },
  ticksContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 45,
    paddingHorizontal: DIAL_WIDTH / 2,
  },
  tick: {
    width: 1,
    height: 12,
    backgroundColor: Colors.editing.textSecondary,
    marginHorizontal: (TICK_SPACING - 1) / 2,
    opacity: 0.4,
  },
  tickMajor: {
    height: 18,
    width: 2,
    opacity: 0.7,
  },
  tickCenter: {
    height: 24,
    width: 2,
    backgroundColor: Colors.editing.text,
    opacity: 1,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 5,
  },
  gradientLeft: {
    left: 0,
    backgroundColor: Colors.editing.backgroundRoot,
    opacity: 0.95,
  },
  gradientRight: {
    right: 0,
    backgroundColor: Colors.editing.backgroundRoot,
    opacity: 0.95,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: DIAL_WIDTH,
    paddingHorizontal: Spacing.xs,
    marginTop: 2,
  },
  rangeLabel: {
    fontSize: 10,
    color: Colors.editing.textSecondary,
  },
});
