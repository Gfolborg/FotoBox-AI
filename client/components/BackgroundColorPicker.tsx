import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

// Background color presets with labels
export const BACKGROUND_COLORS = [
  { hex: "#FFFFFF", label: "White" },
  { hex: "#F5F5F5", label: "Light Gray" },
  { hex: "#FFF8E7", label: "Cream" },
  { hex: "#E3F2FD", label: "Light Blue" },
  { hex: "#FCE4EC", label: "Pale Pink" },
  { hex: "#E8F5E9", label: "Mint" },
  { hex: "#000000", label: "Black" },
] as const;

export type BackgroundColor = (typeof BACKGROUND_COLORS)[number]["hex"];

interface BackgroundColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

interface ColorButtonProps {
  color: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function ColorButton({ color, label, isSelected, onPress }: ColorButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  // Determine if color needs a border (for white/light colors)
  const isLightColor =
    color === "#FFFFFF" || color === "#F5F5F5" || color === "#FFF8E7";
  const isBlack = color === "#000000";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.colorButtonContainer}
    >
      <Animated.View
        style={[
          styles.colorButtonOuter,
          isSelected && {
            borderColor: theme.primary,
            borderWidth: 3,
          },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.colorButton,
            { backgroundColor: color },
            isLightColor && styles.colorButtonBorder,
          ]}
        >
          {isSelected && (
            <Feather
              name="check"
              size={18}
              color={isBlack ? "#FFFFFF" : theme.primary}
            />
          )}
        </View>
      </Animated.View>
      <ThemedText style={styles.colorLabel}>{label}</ThemedText>
    </Pressable>
  );
}

export function BackgroundColorPicker({
  selectedColor,
  onColorSelect,
}: BackgroundColorPickerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Background Color
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorRow}
      >
        {BACKGROUND_COLORS.map((colorOption) => (
          <ColorButton
            key={colorOption.hex}
            color={colorOption.hex}
            label={colorOption.label}
            isSelected={
              selectedColor.toUpperCase() === colorOption.hex.toUpperCase()
            }
            onPress={() => onColorSelect(colorOption.hex)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  colorRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  colorButtonContainer: {
    alignItems: "center",
  },
  colorButtonOuter: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  colorButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  colorButtonBorder: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  colorLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    color: Colors.editing.textSecondary,
  },
});
