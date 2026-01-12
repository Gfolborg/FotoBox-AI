import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing } from "@/constants/theme";

type IconName = keyof typeof Feather.glyphMap;

interface AdjustmentSliderProps {
  icon: IconName;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  serverOnly?: boolean;  // Show badge if adjustment is server-only
}

export function AdjustmentSlider({
  icon,
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onValueChange,
  formatValue,
  serverOnly = false,
}: AdjustmentSliderProps) {
  const handleValueChange = (val: number | number[]) => {
    const newValue = Array.isArray(val) ? val[0] : val;
    onValueChange(newValue);
  };

  const handleDoubleTap = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onValueChange(defaultValue);
  };

  const formattedValue = formatValue
    ? formatValue(value)
    : value > 0
    ? `+${value.toFixed(2)}`
    : value.toFixed(2);

  const isModified = value !== defaultValue;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Feather
            name={icon}
            size={18}
            color={isModified ? Colors.light.primary : Colors.light.textSecondary}
          />
          <ThemedText style={[
            styles.label,
            isModified && styles.labelModified,
          ]}>
            {label}
          </ThemedText>
          {serverOnly && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>On save</ThemedText>
            </View>
          )}
        </View>
        <Pressable onPress={handleDoubleTap} hitSlop={8}>
          <ThemedText style={[
            styles.value,
            isModified && styles.valueModified,
          ]}>
            {formattedValue}
          </ThemedText>
        </Pressable>
      </View>
      <Slider
        containerStyle={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={handleValueChange}
        minimumTrackTintColor={Colors.light.primary}
        maximumTrackTintColor={Colors.light.border}
        thumbTintColor={Colors.light.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  labelModified: {
    color: Colors.light.text,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  valueModified: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  slider: {
    height: 40,
    width: "100%",
  },
  badge: {
    backgroundColor: Colors.light.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.primary,
    textTransform: "uppercase",
  },
});
