import React from "react";
import { Pressable, View, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { PlatformRequirement } from "@/lib/platform-requirements";

interface PlatformChipProps {
  platform: PlatformRequirement;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function PlatformChip({
  platform,
  selected,
  onPress,
  disabled = false,
}: PlatformChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && styles.chipSelected,
          { borderColor: selected ? platform.color : Colors.editing.border },
          disabled && styles.chipDisabled,
          animatedStyle,
        ]}
      >
        {/* Platform Image or Icon */}
        {platform.image ? (
          <View style={styles.imageContainer}>
            <Image
              source={platform.image}
              style={[styles.platformImage, { borderColor: `${platform.color}40` }]}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${platform.color}20` },
            ]}
          >
            <Feather
              name={platform.icon as keyof typeof Feather.glyphMap}
              size={20}
              color={platform.color}
            />
          </View>
        )}

        {/* Platform Name */}
        <ThemedText
          style={[styles.name, selected && styles.nameSelected]}
          numberOfLines={1}
        >
          {platform.name}
        </ThemedText>

        {/* Aspect Ratio Badge */}
        <View style={styles.ratioBadge}>
          <ThemedText style={styles.ratioText}>
            {platform.aspectRatioLabel}
          </ThemedText>
        </View>

        {/* Selection Indicator */}
        {selected && (
          <View style={[styles.checkmark, { backgroundColor: platform.color }]}>
            <Feather name="check" size={12} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 80,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.editing.border,
    alignItems: "center",
    gap: Spacing.xs,
    position: "relative",
  },
  chipSelected: {
    backgroundColor: Colors.editing.backgroundDefault,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  platformImage: {
    width: "120%",
    height: "120%",
  },
  name: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.editing.textSecondary,
    textAlign: "center",
  },
  nameSelected: {
    color: Colors.editing.text,
  },
  ratioBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  ratioText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.editing.textTertiary,
  },
  checkmark: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.editing.backgroundDefault,
  },
});
