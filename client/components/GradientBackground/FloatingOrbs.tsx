import React, { useEffect, useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/theme";
import { FloatingOrbsConfig } from "./types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Orb {
  id: number;
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  movementX: number;
  movementY: number;
}

const DEFAULT_CONFIG: Required<FloatingOrbsConfig> = {
  count: 3,
  colors: [Colors.light.primary, Colors.light.secondary],
  opacity: 0.12,
  speed: "slow",
  minSize: 120,
  maxSize: 200,
};

function getSpeedDuration(speed: "slow" | "normal" | "fast"): number {
  switch (speed) {
    case "fast":
      return 8000;
    case "normal":
      return 12000;
    case "slow":
    default:
      return 18000;
  }
}

function generateOrbs(config: Required<FloatingOrbsConfig>): Orb[] {
  const baseDuration = getSpeedDuration(config.speed);
  const orbs: Orb[] = [];

  for (let i = 0; i < config.count; i++) {
    const size =
      config.minSize + Math.random() * (config.maxSize - config.minSize);
    const colorIndex = i % config.colors.length;

    orbs.push({
      id: i,
      initialX: Math.random() * (SCREEN_WIDTH - size / 2) - size / 4,
      initialY: Math.random() * (SCREEN_HEIGHT - size / 2) - size / 4,
      size,
      color: config.colors[colorIndex],
      duration: baseDuration + Math.random() * 4000,
      delay: i * 500,
      movementX: 20 + Math.random() * 30,
      movementY: 15 + Math.random() * 25,
    });
  }

  return orbs;
}

interface AnimatedOrbProps {
  orb: Orb;
  opacity: number;
}

function AnimatedOrb({ orb, opacity }: AnimatedOrbProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      orb.delay,
      withRepeat(
        withTiming(1, {
          duration: orb.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1, // infinite
        true, // reverse
      ),
    );
  }, [orb.delay, orb.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    // Lissajous curve for organic movement
    const translateX = interpolate(
      progress.value,
      [0, 0.25, 0.5, 0.75, 1],
      [0, orb.movementX, 0, -orb.movementX * 0.5, 0],
    );
    const translateY = interpolate(
      progress.value,
      [0, 0.33, 0.66, 1],
      [0, -orb.movementY, orb.movementY * 0.7, 0],
    );
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.08, 1]);
    const orbOpacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [opacity * 0.8, opacity, opacity * 0.8],
    );

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      opacity: orbOpacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: orb.initialX,
          top: orb.initialY,
          width: orb.size,
          height: orb.size,
          borderRadius: orb.size / 2,
          backgroundColor: orb.color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface FloatingOrbsProps {
  config?: FloatingOrbsConfig;
}

export function FloatingOrbs({ config }: FloatingOrbsProps) {
  const mergedConfig: Required<FloatingOrbsConfig> = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
    }),
    [config],
  );

  const orbs = useMemo(() => generateOrbs(mergedConfig), [mergedConfig]);

  return (
    <View style={styles.container} pointerEvents="none">
      {orbs.map((orb) => (
        <AnimatedOrb key={orb.id} orb={orb} opacity={mergedConfig.opacity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
