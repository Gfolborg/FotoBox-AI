import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";
import { EditingPreset } from "@/types/preset";

interface PresetCardProps {
  preset: EditingPreset;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 20,
  mass: 0.4,
  stiffness: 200,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PresetCard({
  preset,
  onPress,
  onLongPress,
  selected = false,
}: PresetCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const hasAdjustments =
    preset.adjustments.brightness !== 0 ||
    preset.adjustments.contrast !== 1 ||
    preset.adjustments.saturation !== 1 ||
    preset.adjustments.exposure !== 0 ||
    preset.adjustments.highlights !== 0 ||
    preset.adjustments.shadows !== 0 ||
    preset.adjustments.warmth !== 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={[
        styles.card,
        selected && styles.cardSelected,
        animatedStyle,
      ]}
    >
      {selected && (
        <View style={styles.selectedBadge}>
          <Feather name="check" size={14} color={Colors.light.buttonText} />
        </View>
      )}

      <View style={styles.header}>
        <View
          style={[
            styles.colorSwatch,
            { backgroundColor: preset.backgroundColor },
          ]}
        />
        <View style={styles.titleContainer}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {preset.name}
          </ThemedText>
          <ThemedText style={styles.date}>
            {formatDate(preset.createdAt)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.adjustmentsRow}>
        {hasAdjustments ? (
          <>
            {preset.adjustments.brightness !== 0 && (
              <View style={styles.adjustmentPill}>
                <Feather name="sun" size={12} color={Colors.light.primary} />
              </View>
            )}
            {preset.adjustments.contrast !== 1 && (
              <View style={styles.adjustmentPill}>
                <Feather name="circle" size={12} color={Colors.light.primary} />
              </View>
            )}
            {preset.adjustments.saturation !== 1 && (
              <View style={styles.adjustmentPill}>
                <Feather name="droplet" size={12} color={Colors.light.primary} />
              </View>
            )}
            {preset.adjustments.warmth !== 0 && (
              <View style={styles.adjustmentPill}>
                <Feather
                  name="thermometer"
                  size={12}
                  color={Colors.light.primary}
                />
              </View>
            )}
          </>
        ) : (
          <ThemedText style={styles.defaultText}>Default adjustments</ThemedText>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  cardSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  selectedBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  date: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  adjustmentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  adjustmentPill: {
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  defaultText: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
});
