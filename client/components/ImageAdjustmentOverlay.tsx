import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAG_SENSITIVITY = 0.005;

interface AdjustmentConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  format: (val: number) => string;
}

interface ImageAdjustmentOverlayProps {
  children: React.ReactNode;
  activeAdjustment: AdjustmentConfig | null;
  currentValue: number;
  onValueChange: (value: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  enabled: boolean;
}

export function ImageAdjustmentOverlay({
  children,
  activeAdjustment,
  currentValue,
  onValueChange,
  onDragStart,
  onDragEnd,
  enabled,
}: ImageAdjustmentOverlayProps) {
  const isDragging = useSharedValue(false);
  const dragStartValue = useSharedValue(0);
  const displayValue = useSharedValue("");
  const indicatorOpacity = useSharedValue(0);
  const indicatorScale = useSharedValue(0.8);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDragStart = () => {
    onDragStart();
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const updateValue = (newValue: number) => {
    onValueChange(newValue);
  };

  const panGesture = Gesture.Pan()
    .enabled(enabled && activeAdjustment !== null)
    .onStart(() => {
      isDragging.value = true;
      dragStartValue.value = currentValue;
      indicatorOpacity.value = withSpring(1);
      indicatorScale.value = withSpring(1);
      runOnJS(handleDragStart)();
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      if (!activeAdjustment) return;

      const delta = event.translationX * DRAG_SENSITIVITY;
      const range = activeAdjustment.max - activeAdjustment.min;
      const newValue = Math.max(
        activeAdjustment.min,
        Math.min(activeAdjustment.max, dragStartValue.value + delta * range)
      );

      const steppedValue =
        Math.round(newValue / activeAdjustment.step) * activeAdjustment.step;

      displayValue.value = activeAdjustment.format(steppedValue);
      runOnJS(updateValue)(steppedValue);
    })
    .onEnd(() => {
      isDragging.value = false;
      indicatorOpacity.value = withTiming(0, { duration: 300 });
      indicatorScale.value = withTiming(0.8, { duration: 300 });
      runOnJS(handleDragEnd)();
    });

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scale: indicatorScale.value }],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.gestureArea}>{children}</Animated.View>
      </GestureDetector>

      <Animated.View style={[styles.valueIndicator, indicatorStyle]}>
        <View style={styles.indicatorContent}>
          <ThemedText style={styles.indicatorLabel}>
            {activeAdjustment?.label || ""}
          </ThemedText>
          <ThemedText style={styles.indicatorValue}>
            {activeAdjustment ? activeAdjustment.format(currentValue) : ""}
          </ThemedText>
        </View>
        <View style={styles.dragHint}>
          <ThemedText style={styles.dragHintText}>← Drag to adjust →</ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
  valueIndicator: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  indicatorContent: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  indicatorLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  indicatorValue: {
    color: Colors.editing.text,
    fontSize: 28,
    fontWeight: "700",
  },
  dragHint: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: BorderRadius.full,
  },
  dragHintText: {
    color: Colors.editing.primary,
    fontSize: 11,
    fontWeight: "500",
  },
});
