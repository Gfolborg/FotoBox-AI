import React from "react";
import { StyleSheet, View, Image, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors, BorderRadius, Shadows } from "@/constants/theme";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  size?: number;
  initialPosition?: number; // 0-1, default 0.5
}

const SLIDER_WIDTH = 4;
const HANDLE_SIZE = 44;

/**
 * A swipeable before/after image comparison slider.
 * Users can drag the divider to reveal more of either image.
 */
export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  size = Dimensions.get("window").width * 0.85,
  initialPosition = 0.5,
}: BeforeAfterSliderProps) {
  const position = useSharedValue(initialPosition);
  const isActive = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      const newPosition = clamp(
        initialPosition + event.translationX / size,
        0.05,
        0.95,
      );
      position.value = newPosition;
    })
    .onEnd(() => {
      isActive.value = false;
    });

  // Animated styles for the reveal mask
  const revealStyle = useAnimatedStyle(() => ({
    width: `${position.value * 100}%`,
  }));

  // Animated styles for the slider line
  const sliderStyle = useAnimatedStyle(() => ({
    left: `${position.value * 100}%`,
    transform: [{ translateX: -SLIDER_WIDTH / 2 }],
  }));

  // Animated styles for the handle
  const handleStyle = useAnimatedStyle(() => ({
    left: `${position.value * 100}%`,
    transform: [
      { translateX: -HANDLE_SIZE / 2 },
      { scale: withSpring(isActive.value ? 1.1 : 1, { damping: 15 }) },
    ],
  }));

  // Handle glow when active
  const handleGlowStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isActive.value ? 0.4 : 0, { damping: 15 }),
    transform: [
      { scale: withSpring(isActive.value ? 1.3 : 1, { damping: 15 }) },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* After image (background) */}
      <Image
        source={{ uri: afterImage }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Before image (revealed by slider) */}
      <Animated.View style={[styles.revealContainer, revealStyle]}>
        <Image
          source={{ uri: beforeImage }}
          style={[styles.image, { width: size }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Slider line */}
      <Animated.View style={[styles.sliderLine, sliderStyle]} />

      {/* Draggable handle */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.handleContainer, handleStyle]}>
          {/* Glow effect */}
          <Animated.View style={[styles.handleGlow, handleGlowStyle]} />

          {/* Handle button */}
          <View style={styles.handle}>
            <Feather
              name="chevrons-left"
              size={14}
              color={Colors.light.white}
            />
            <Feather
              name="chevrons-right"
              size={14}
              color={Colors.light.white}
            />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Labels */}
      <View style={styles.labelContainer}>
        <View style={[styles.label, styles.labelLeft]}>
          <Feather name="image" size={12} color={Colors.light.white} />
        </View>
        <View style={[styles.label, styles.labelRight]}>
          <Feather name="check-circle" size={12} color={Colors.light.white} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.light.backgroundTertiary,
    ...Shadows.lg,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  revealContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  sliderLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SLIDER_WIDTH,
    backgroundColor: Colors.light.white,
    shadowColor: Colors.light.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  handleContainer: {
    position: "absolute",
    top: "50%",
    marginTop: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  handleGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.primary,
    borderRadius: HANDLE_SIZE / 2,
  },
  handle: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: -4,
    ...Shadows.md,
    // Border for better visibility
    borderWidth: 3,
    borderColor: Colors.light.white,
  },
  labelContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  labelLeft: {},
  labelRight: {},
});
