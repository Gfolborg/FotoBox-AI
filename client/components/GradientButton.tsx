import React from "react";
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import {
  Colors,
  BorderRadius,
  Spacing,
  Shadows,
  Typography,
  Animations,
  Gradients,
} from "@/constants/theme";

type FeatherIconName = keyof typeof Feather.glyphMap;

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  icon?: FeatherIconName;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}: GradientButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);
    return {
      transform: [{ scale }],
      opacity: interpolate(pressed.value, [0, 1], [1, 0.9]),
    };
  });

  const handlePressIn = () => {
    if (disabled || loading) return;
    pressed.value = withSpring(1, Animations.springFast);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, Animations.springFast);
  };

  const sizeStyles = {
    sm: {
      height: 40,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.buttonSm.fontSize,
      iconSize: 16,
    },
    md: {
      height: Spacing.buttonHeight,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.button.fontSize,
      iconSize: 20,
    },
    lg: {
      height: 56,
      paddingHorizontal: Spacing["2xl"],
      fontSize: Typography.button.fontSize,
      iconSize: 22,
    },
  };

  const currentSize = sizeStyles[size];
  const isDisabled = disabled || loading;

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "ghost" ? Colors.light.primary : Colors.light.buttonText}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Feather
              name={icon}
              size={currentSize.iconSize}
              color={variant === "ghost" ? Colors.light.primary : Colors.light.buttonText}
              style={styles.iconLeft}
            />
          )}
          <ThemedText
            style={[
              styles.text,
              { fontSize: currentSize.fontSize },
              variant === "ghost" && styles.textGhost,
              variant === "glass" && styles.textGlass,
            ]}
          >
            {title}
          </ThemedText>
          {icon && iconPosition === "right" && (
            <Feather
              name={icon}
              size={currentSize.iconSize}
              color={variant === "ghost" ? Colors.light.primary : Colors.light.buttonText}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (variant === "primary") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={Gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              height: currentSize.height,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            Shadows.accent,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (variant === "secondary") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={Gradients.secondary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              height: currentSize.height,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            Shadows.accentBlue,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (variant === "glass") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.glass,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
          animatedStyle,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.ghost,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        animatedStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  glass: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: Colors.light.buttonText,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  textGhost: {
    color: Colors.light.primary,
  },
  textGlass: {
    color: Colors.light.buttonText,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
});
