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

  const isPrimary = variant === "primary";

  return (
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
      {badge && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      )}

      <View
        style={[
          styles.iconContainer,
          isPrimary ? styles.iconContainerPrimary : styles.iconContainerSecondary,
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
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 180,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: "relative",
    ...Shadows.md,
  },
  cardPrimary: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  cardSecondary: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  badge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
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
  },
  iconContainerSecondary: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
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
    bottom: Spacing.lg,
    right: Spacing.lg,
  },
});
