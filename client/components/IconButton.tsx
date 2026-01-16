import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, Animations } from "@/constants/theme";

type FeatherIconName = keyof typeof Feather.glyphMap;

interface IconButtonProps {
  icon: FeatherIconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  variant?: "default" | "glass" | "solid" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  icon,
  onPress,
  size = 48,
  iconSize = 24,
  color = Colors.light.buttonText,
  variant = "glass",
  disabled = false,
  style,
}: IconButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.9]);
    return {
      transform: [{ scale }],
      opacity: interpolate(pressed.value, [0, 1], [1, 0.8]),
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    pressed.value = withSpring(1, Animations.springFast);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, Animations.springFast);
  };

  const getVariantStyle = () => {
    switch (variant) {
      case "glass":
        return styles.glass;
      case "solid":
        return styles.solid;
      case "ghost":
        return styles.ghost;
      default:
        return styles.default;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        getVariantStyle(),
        { width: size, height: size, borderRadius: size / 2 },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {variant === "glass" && (
        <BlurView
          intensity={30}
          tint="light"
          style={[styles.blur, { borderRadius: size / 2 }]}
        />
      )}
      <Feather name={icon} size={iconSize} color={color} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    minWidth: Spacing.touchTarget,
    minHeight: Spacing.touchTarget,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  glass: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  solid: {
    backgroundColor: Colors.light.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  default: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  disabled: {
    opacity: 0.4,
  },
});
