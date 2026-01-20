import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, Animations } from "@/constants/theme";

interface SuccessAnimationProps {
  onComplete?: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  delay?: number;
}

export function SuccessAnimation({
  onComplete,
  size = 120,
  color = Colors.light.success,
  backgroundColor = "rgba(34, 197, 94, 0.15)",
  delay = 0,
}: SuccessAnimationProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    const triggerHaptic = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const triggerComplete = () => {
      onComplete?.();
    };

    scale.value = withDelay(
      delay,
      withSpring(1, {
        ...Animations.spring,
        damping: 12,
      }),
    );

    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));

    checkScale.value = withDelay(
      delay + 200,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 200 }),
      ),
    );

    ringScale.value = withDelay(
      delay + 100,
      withSequence(
        withTiming(1.3, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(1.5, { duration: 200 }),
      ),
    );

    ringOpacity.value = withDelay(
      delay + 100,
      withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 400 }),
      ),
    );

    const hapticTimeout = setTimeout(() => {
      triggerHaptic();
    }, delay + 200);

    const completeTimeout = setTimeout(() => {
      triggerComplete();
    }, delay + 800);

    return () => {
      clearTimeout(hapticTimeout);
      clearTimeout(completeTimeout);
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View style={[styles.wrapper, { width: size * 1.5, height: size * 1.5 }]}>
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
        ]}
      >
        <Animated.View style={checkStyle}>
          <Feather name="check" size={size * 0.5} color={color} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 3,
  },
});
