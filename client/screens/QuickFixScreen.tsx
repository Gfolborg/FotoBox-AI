import React, { useState, useRef, useCallback } from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

import { ThemedText } from "@/components/ThemedText";
import { GlassPill } from "@/components/GlassPill";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { SkiaEditableImage, SkiaEditableImageRef } from "@/components/SkiaEditableImage";
import { QuickFixToolbar } from "@/components/QuickFixToolbar";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useQuickFix } from "@/hooks/useQuickFix";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "QuickFix">;
type RouteProps = RouteProp<RootStackParamList, "QuickFix">;

type ToolKey = "rotate" | "flip" | "crop" | "brightness" | "contrast";

export default function QuickFixScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri } = route.params;

  const imageRef = useRef<SkiaEditableImageRef>(null);
  const [selectedTool, setSelectedTool] = useState<ToolKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preparedUri, setPreparedUri] = useState<string | null>(null);

  const {
    state,
    rotateCW,
    rotateCCW,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setCrop,
    setAspectRatio,
    setBrightness,
    setContrast,
    resetAll,
    hasChanges,
    getSkiaAdjustments,
  } = useQuickFix();

  // Shared values for gesture-based adjustments
  const startValue = useSharedValue(0);
  const currentAdjustValue = useSharedValue(0);
  const isAdjusting = useSharedValue(false);

  // Check if adjustment tool is active
  const isAdjustmentTool = selectedTool === "brightness" || selectedTool === "contrast";

  // Update adjustment value from gesture
  const updateBrightness = useCallback(
    (newValue: number) => {
      setBrightness(Math.max(-100, Math.min(100, newValue)));
    },
    [setBrightness]
  );

  const updateContrast = useCallback(
    (newValue: number) => {
      setContrast(Math.max(-100, Math.min(100, newValue)));
    },
    [setContrast]
  );

  // Haptic feedback for adjustment boundaries
  const triggerBoundaryHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Pan gesture for brightness/contrast adjustment
  const adjustGesture = Gesture.Pan()
    .enabled(isAdjustmentTool)
    .onStart(() => {
      isAdjusting.value = true;
      startValue.value =
        selectedTool === "brightness" ? state.brightness : state.contrast;
    })
    .onUpdate((event) => {
      // Vertical movement: negative Y (swipe up) = increase, positive Y (swipe down) = decrease
      // Reduced sensitivity for finer control
      const sensitivity = 0.15;
      const delta = -event.translationY * sensitivity;
      const newValue = Math.max(-100, Math.min(100, Math.round(startValue.value + delta)));

      // Check if we hit boundaries
      if (
        (newValue === -100 && currentAdjustValue.value !== -100) ||
        (newValue === 100 && currentAdjustValue.value !== 100)
      ) {
        runOnJS(triggerBoundaryHaptic)();
      }

      currentAdjustValue.value = newValue;

      if (selectedTool === "brightness") {
        runOnJS(updateBrightness)(newValue);
      } else {
        runOnJS(updateContrast)(newValue);
      }
    })
    .onEnd(() => {
      isAdjusting.value = false;
    });

  // Animated style for adjustment indicator
  const adjustIndicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isAdjusting.value ? 1 : 0, { duration: 150 }),
  }));

  // Prepare image for Skia on mount
  React.useEffect(() => {
    const prepareImage = async () => {
      try {
        // If already a data URI, use directly
        if (imageUri.startsWith("data:")) {
          console.log("[QuickFix] Using data URI directly");
          setPreparedUri(imageUri);
          return;
        }

        // Convert image to JPEG data URI for Skia compatibility
        // Using base64 data URI is more reliable than file paths across platforms
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipResult.base64) {
          const dataUri = `data:image/jpeg;base64,${manipResult.base64}`;
          console.log("[QuickFix] Created data URI, length:", dataUri.length);
          setPreparedUri(dataUri);
        } else {
          // Fallback to file URI as-is
          console.log("[QuickFix] Using file URI:", manipResult.uri);
          setPreparedUri(manipResult.uri);
        }
      } catch (error) {
        console.error("[QuickFix] Failed to prepare image:", error);
        // Fallback to original URI as-is
        setPreparedUri(imageUri);
      }
    };

    prepareImage();
  }, [imageUri]);

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate directly to PhotoAction with original image
    navigation.navigate("PhotoAction", { imageUri });
  };

  const handleContinue = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let finalUri = imageUri;

      // If changes were made, create a snapshot
      if (hasChanges() && imageRef.current) {
        const snapshotUri = await imageRef.current.snapshot();
        if (snapshotUri) {
          // Save snapshot to file
          const filename = `quickfix_result_${Date.now()}.jpg`;
          const fileUri = `${FileSystem.documentDirectory}${filename}`;

          const base64Data = snapshotUri.split(",")[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          finalUri = fileUri;
        }
      }

      // Navigate to PhotoAction with the (potentially modified) image
      navigation.navigate("PhotoAction", { imageUri: finalUri });
    } catch (error) {
      console.error("[QuickFix] Failed to process image:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to process image. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetAll();
    setSelectedTool(null);
  };

  const showCropOverlay = selectedTool === "crop";

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Pressable
              style={styles.headerButton}
              onPress={handleSkip}
              disabled={isProcessing}
            >
              <ThemedText style={styles.skipText}>Skip</ThemedText>
            </Pressable>

            <GlassPill>
              <Feather name="edit-3" size={16} color={Colors.editing.primary} />
              <ThemedText style={styles.headerTitle}>Quick Fix</ThemedText>
            </GlassPill>

            <Pressable
              style={styles.headerButton}
              onPress={handleReset}
              disabled={!hasChanges() || isProcessing}
            >
              <ThemedText
                style={[
                  styles.resetText,
                  (!hasChanges() || isProcessing) && styles.resetTextDisabled,
                ]}
              >
                Reset
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Content */}
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {/* Image Preview with Gesture Handler */}
        <GestureDetector gesture={adjustGesture}>
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.imageContainer}
          >
            {preparedUri ? (
              <SkiaEditableImage
                ref={imageRef}
                originalUri={preparedUri}
                adjustments={getSkiaAdjustments()}
                showOriginal={false}
                showCropOverlay={showCropOverlay}
                crop={state.crop}
                aspectRatio={state.aspectRatio}
                onCropChange={setCrop}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="image" size={48} color={Colors.editing.textTertiary} />
                <ThemedText style={styles.loadingText}>Loading...</ThemedText>
              </View>
            )}

            {/* Adjustment Value Indicator */}
            {isAdjustmentTool && (
              <Animated.View style={[styles.adjustValueIndicator, adjustIndicatorStyle]}>
                <ThemedText style={styles.adjustValueText}>
                  {selectedTool === "brightness"
                    ? `Brightness: ${state.brightness > 0 ? "+" : ""}${state.brightness}`
                    : `Contrast: ${state.contrast > 0 ? "+" : ""}${state.contrast}`}
                </ThemedText>
              </Animated.View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Hint Text */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.hintContainer}
        >
          <ThemedText style={styles.hintText}>
            {selectedTool === "crop"
              ? "Drag corners to crop"
              : isAdjustmentTool
              ? `Swipe up/down on image to adjust ${selectedTool}`
              : "Quick fixes before AI enhancement"}
          </ThemedText>
        </Animated.View>

        {/* Toolbar */}
        <QuickFixToolbar
          state={state}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          onRotateCW={rotateCW}
          onRotateCCW={rotateCCW}
          onToggleFlipHorizontal={toggleFlipHorizontal}
          onToggleFlipVertical={toggleFlipVertical}
          onAspectRatioChange={setAspectRatio}
        />

        {/* Continue Button */}
        <View style={styles.actionBar}>
          <GradientButton
            title={isProcessing ? "Processing..." : "Continue"}
            onPress={handleContinue}
            disabled={isProcessing}
            loading={isProcessing}
            icon="arrow-right"
            fullWidth
          />
        </View>
      </View>
    </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    minWidth: 60,
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  skipText: {
    color: Colors.editing.textSecondary,
    fontWeight: "600",
    fontSize: 16,
  },
  resetText: {
    color: Colors.editing.primary,
    fontWeight: "600",
    fontSize: 16,
    textAlign: "right",
  },
  resetTextDisabled: {
    color: Colors.editing.textTertiary,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  imagePlaceholder: {
    width: 280,
    height: 280,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.editing.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.editing.textTertiary,
    fontSize: 14,
  },
  hintContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  hintText: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  actionBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  adjustValueIndicator: {
    position: "absolute",
    top: Spacing.md,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  adjustValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.editing.buttonText,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
});
