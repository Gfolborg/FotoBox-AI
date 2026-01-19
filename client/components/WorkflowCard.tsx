import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import {
  Colors,
  BorderRadius,
  Spacing,
  Shadows,
  Animations,
  Gradients,
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
    const rotateX = interpolate(pressed.value, [0, 1], [0, 1.5]);

    return {
      transform: [
        { scale },
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
      ],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, Animations.springFast);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, Animations.springFast);
  };

  const isPrimary = variant === "primary";

  return (
    <View style={styles.wrapper}>
      {/* Gradient border for primary cards */}
      {isPrimary && (
        <LinearGradient
          colors={Gradients.accent as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      )}

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
            isPrimary ? styles.iconContainerPrimary : styles.iconContainerSecondary,
          ]}
        >
          {isPrimary ? (
            <LinearGradient
              colors={Gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Feather name={icon} size={26} color={Colors.light.buttonText} />
            </LinearGradient>
          ) : (
            <Feather name={icon} size={26} color={Colors.light.primary} />
          )}
        </View>

        <ThemedText style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>

        <ThemedText style={styles.description} numberOfLines={2}>
          {description}
        </ThemedText>

        <View style={[styles.arrowContainer, isPrimary && styles.arrowContainerPrimary]}>
          <Feather
            name="arrow-right"
            size={18}
            color={isPrimary ? Colors.light.primary : Colors.light.textTertiary}
          />
        </View>
      </AnimatedPressable>

      {badge && (
        <LinearGradient
          colors={Gradients.secondary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.badge}
        >
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  gradientBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: BorderRadius.xl + 2,
    opacity: 0.6,
  },
  card: {
    flex: 1,
    minHeight: 175,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  cardPrimary: {
    backgroundColor: Colors.light.backgroundDefault,
    borderWidth: 0,
  },
  cardSecondary: {
    backgroundColor: Colors.light.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 14,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
    ...Shadows.accentBlue,
  },
  badgeText: {
    color: Colors.light.buttonText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  iconContainerPrimary: {
    ...Shadows.accent,
  },
  iconContainerSecondary: {
    backgroundColor: Colors.light.primarySubtle,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.15)",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  arrowContainer: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowContainerPrimary: {
    backgroundColor: Colors.light.primarySubtle,
  },
});
