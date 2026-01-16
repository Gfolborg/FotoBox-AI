import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, CircleProps } from "react-native-svg";
import { Colors, Animations } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle) as React.ComponentType<
  CircleProps & { animatedProps?: Partial<CircleProps> }
>;

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = Colors.light.primary,
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const strokeDashoffset = withTiming(
      circumference * (1 - clampedProgress),
      {
        duration: Animations.timing.normal,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }
    );
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    position: "absolute",
  },
  content: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});
