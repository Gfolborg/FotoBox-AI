import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import {
  Colors,
  BorderRadius,
  Spacing,
  Shadows,
} from "@/constants/theme";

type FeatherIconName = keyof typeof Feather.glyphMap;

interface WorkflowCardProps {
  icon: FeatherIconName;
  title: string;
  description: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  badge?: string;
}

const springConfig: WithSpringConfig = {
  damping: 20,
  mass: 0.4,
  stiffness: 200,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WorkflowCard({
  icon,
  title,
  description,
  onPress,
  variant = "secondary",
  badge,
}: WorkflowCardProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const rotateX = interpolate(pressed.value, [0, 1], [0, 2]);
    const rotateZ = interpolate(pressed.value, [0, 1], [0, -0.5]);

    return {
      transform: [
        { scale },
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, springConfig);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, springConfig);
  };

  const isPrimary = variant === "primary";

  return (
    <View>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          isPrimary ? styles.cardPrimary : styles.cardSecondary,
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            isPrimary
              ? styles.iconContainerPrimary
              : styles.iconContainerSecondary,
          ]}
        >
          <Feather
            name={icon}
            size={28}
            color={isPrimary ? Colors.light.buttonText : Colors.light.primary}
          />
        </View>

        <ThemedText
          style={[styles.title, isPrimary && styles.titlePrimary]}
          numberOfLines={2}
        >
          {title}
        </ThemedText>

        <ThemedText style={styles.description} numberOfLines={2}>
          {description}
        </ThemedText>

        <View style={styles.arrowContainer}>
          <Feather
            name="arrow-right"
            size={20}
            color={isPrimary ? Colors.light.primary : Colors.light.textSecondary}
          />
        </View>
      </AnimatedPressable>

      {badge && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 180,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  cardPrimary: {
    backgroundColor: Colors.light.backgroundDefault,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    // Enhanced glow for primary card
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardSecondary: {
    backgroundColor: Colors.light.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: 12,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.light.backgroundDefault,
    // Glowing badge
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: Colors.light.buttonText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  iconContainerPrimary: {
    backgroundColor: Colors.light.primary,
    // Glowing icon container
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainerSecondary: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  titlePrimary: {
    color: Colors.light.text,
  },
  description: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  arrowContainer: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
