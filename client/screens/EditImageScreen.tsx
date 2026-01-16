import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { GestureHandlerRootView, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { GradientButton } from "@/components/GradientButton";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { ProgressRing } from "@/components/ProgressRing";
import { CompactToolbar, ADJUSTMENT_TOOLS, ToolConfig } from "@/components/CompactToolbar";
import { SavePresetModal } from "@/components/SavePresetModal";
import {
  SkiaEditableImage,
  SkiaEditableImageRef,
} from "@/components/SkiaEditableImage";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { useImageEditing } from "@/hooks/useImageEditing";
import { usePresets } from "@/hooks/usePresets";
import { getPresetById } from "@/lib/preset-storage";
import { useNotification } from "@/context/NotificationContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_SENSITIVITY = 0.004;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "EditImage">;
type EditImageRouteProp = RouteProp<RootStackParamList, "EditImage">;

type ToolKey =
  | "brightness"
  | "contrast"
  | "saturation"
  | "exposure"
  | "highlights"
  | "shadows"
  | "warmth"
  | "rotate"
  | "flip"
  | "crop";

export default function EditImageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditImageRouteProp>();
  const { showNotification } = useNotification();
  const { imageUri, presetId } = route.params;

  const imageRef = useRef<SkiaEditableImageRef>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolKey | null>("brightness");
  const [isToolbarHidden, setIsToolbarHidden] = useState(false);

  const {
    state,
    updateAdjustment,
    resetAll,
    toggleBeforeAfter,
    rotateCW,
    rotateCCW,
    toggleFlipHorizontal,
    toggleFlipVertical,
    hasChanges,
  } = useImageEditing();

  const { saveCurrentAsPreset, applyPresetToState, isSaving } = usePresets();

  const isDragging = useSharedValue(false);
  const dragStartValue = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const indicatorScale = useSharedValue(0.8);
  const currentDisplayValue = useSharedValue("");

  useEffect(() => {
    if (presetId) {
      getPresetById(presetId).then((preset) => {
        if (preset) {
          applyPresetToState(preset, updateAdjustment);
        }
      });
    }
  }, [presetId]);

  const handleSavePreset = async (name: string) => {
    try {
      await saveCurrentAsPreset(name, state);
      showNotification(`"${name}" has been saved to your presets.`, "success");
    } catch {
      showNotification("Failed to save preset. Please try again.", "error");
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleGenerateMainImage = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(state.selectedBackgroundColor);
      const endpoint = `${apiUrl}api/main-image?backgroundColor=${bgColorParam}`;

      const response = await fetch(endpoint, { method: "POST", body: formData });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to process image");
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const base64data = reader.result as string;
        navigation.replace("Result", {
          resultUri: base64data,
          originalUri: imageUri,
          backgroundColor: state.selectedBackgroundColor,
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showNotification(errorMessage, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getActiveToolConfig = (): ToolConfig | null => {
    if (!selectedTool) return null;
    const tool = ADJUSTMENT_TOOLS.find((t) => t.key === selectedTool);
    return tool && tool.min !== undefined ? tool : null;
  };

  const activeToolConfig = getActiveToolConfig();
  const currentValue = activeToolConfig
    ? (state[activeToolConfig.key as keyof typeof state] as number)
    : 0;

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDragStart = () => {
    setIsToolbarHidden(true);
  };

  const handleDragEnd = () => {
    setIsToolbarHidden(false);
  };

  const updateValue = (newValue: number) => {
    if (activeToolConfig) {
      updateAdjustment(activeToolConfig.key as keyof typeof state, newValue as never);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(activeToolConfig !== null)
    .onStart(() => {
      isDragging.value = true;
      dragStartValue.value = currentValue;
      indicatorOpacity.value = withSpring(1);
      indicatorScale.value = withSpring(1);
      runOnJS(handleDragStart)();
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      if (!activeToolConfig) return;

      const delta = event.translationX * DRAG_SENSITIVITY;
      const range = activeToolConfig.max! - activeToolConfig.min!;
      const newValue = Math.max(
        activeToolConfig.min!,
        Math.min(activeToolConfig.max!, dragStartValue.value + delta * range)
      );

      const steppedValue =
        Math.round(newValue / activeToolConfig.step!) * activeToolConfig.step!;

      runOnJS(updateValue)(steppedValue);
    })
    .onEnd(() => {
      isDragging.value = false;
      indicatorOpacity.value = withTiming(0, { duration: 300 });
      indicatorScale.value = withTiming(0.8, { duration: 300 });
      runOnJS(handleDragEnd)();
    });

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scale: indicatorScale.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GradientBackground variant="warm" style={styles.container}>
      <StatusBar style="dark" />

      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
            <ThemedText style={styles.headerButtonText}>Cancel</ThemedText>
          </Pressable>

          <GlassPill>
            <ThemedText style={styles.headerTitle}>Edit</ThemedText>
          </GlassPill>

          <View style={styles.headerRight}>
            <Pressable
              onPressIn={toggleBeforeAfter}
              onPressOut={toggleBeforeAfter}
              style={styles.compareButton}
            >
              <Feather name="eye" size={18} color={Colors.editing.text} />
            </Pressable>
            <IconButton
              icon="bookmark"
              onPress={() => setShowSavePresetModal(true)}
              size={40}
              iconSize={20}
              variant="ghost"
              color={Colors.editing.primary}
            />
          </View>
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.imageContainer}>
          <SkiaEditableImage
            ref={imageRef}
            originalUri={imageUri}
            adjustments={{
              brightness: state.brightness,
              contrast: state.contrast,
              saturation: state.saturation,
              exposure: state.exposure,
              highlights: state.highlights,
              shadows: state.shadows,
              warmth: state.warmth,
              rotation: state.rotation,
              flipHorizontal: state.flipHorizontal,
              flipVertical: state.flipVertical,
            }}
            showOriginal={state.showBeforeAfter}
            showCropOverlay={selectedTool === "crop"}
            crop={state.crop}
            onCropChange={(crop) => updateAdjustment("crop", crop)}
          />

          <Animated.View style={[styles.valueIndicator, indicatorStyle]} pointerEvents="none">
            <View style={styles.indicatorContent}>
              <ThemedText style={styles.indicatorLabel}>
                {activeToolConfig?.label || ""}
              </ThemedText>
              <ThemedText style={styles.indicatorValue}>
                {activeToolConfig?.format ? activeToolConfig.format(currentValue) : ""}
              </ThemedText>
            </View>
            <View style={styles.dragHint}>
              <ThemedText style={styles.dragHintText}>← Drag to adjust →</ThemedText>
            </View>
          </Animated.View>

          {isProcessing && (
            <View style={styles.processingOverlay}>
              <BlurView intensity={60} tint="light" style={styles.processingBlur} />
              <View style={styles.processingContent}>
                <ProgressRing
                  progress={0.7}
                  size={72}
                  strokeWidth={5}
                  color={Colors.editing.primary}
                  backgroundColor={Colors.editing.border}
                >
                  <Feather name="cpu" size={24} color={Colors.editing.primary} />
                </ProgressRing>
                <ThemedText style={styles.processingText}>Processing...</ThemedText>
                <ThemedText style={styles.processingHint}>This may take a moment</ThemedText>
              </View>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      <CompactToolbar
        state={state}
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onUpdateAdjustment={updateAdjustment}
        onRotateCW={rotateCW}
        onRotateCCW={rotateCCW}
        onToggleFlipHorizontal={toggleFlipHorizontal}
        onToggleFlipVertical={toggleFlipVertical}
        isHidden={isToolbarHidden}
      />

      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={[styles.bottomActionBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BlurView intensity={40} tint="light" style={styles.buttonBlur} />
        <View style={styles.actionBarContent}>
          <View style={styles.buttonRow}>
            <Button
              onPress={resetAll}
              variant="outline"
              disabled={isProcessing || !hasChanges()}
              style={styles.resetButton}
            >
              Reset
            </Button>

            <GradientButton
              title={isProcessing ? "Processing..." : "Generate"}
              onPress={handleGenerateMainImage}
              disabled={isProcessing}
              loading={isProcessing}
              icon="zap"
              style={styles.generateButton}
            />
          </View>
        </View>
      </Animated.View>

      <SavePresetModal
        visible={showSavePresetModal}
        onClose={() => setShowSavePresetModal(false)}
        onSave={handleSavePreset}
        adjustments={{
          brightness: state.brightness,
          contrast: state.contrast,
          saturation: state.saturation,
          exposure: state.exposure,
          highlights: state.highlights,
          shadows: state.shadows,
          warmth: state.warmth,
        }}
        backgroundColor={state.selectedBackgroundColor}
        aiSettings={{
          environment: state.aiEnvironment,
          isCustom: state.aiIsCustom,
          productDescription: state.aiProductDescription,
          shadowControl: state.aiShadowControl,
        }}
        isSaving={isSaving}
      />
      </GradientBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
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
  },
  headerButtonText: {
    color: Colors.editing.text,
    fontWeight: "500",
    fontSize: 16,
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  compareButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    marginTop: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  valueIndicator: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  indicatorContent: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.editing.border,
    ...Shadows.lg,
  },
  indicatorLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  indicatorValue: {
    color: Colors.editing.text,
    fontSize: 28,
    fontWeight: "700",
  },
  dragHint: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderRadius: BorderRadius.full,
  },
  dragHintText: {
    color: Colors.editing.primary,
    fontSize: 11,
    fontWeight: "500",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  processingBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  processingContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  processingText: {
    color: Colors.editing.text,
    fontSize: 18,
    fontWeight: "600",
  },
  processingHint: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
  },
  bottomActionBar: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  buttonBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  actionBarContent: {
    padding: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: Colors.editing.border,
    borderRadius: BorderRadius.xl,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
  },
  generateButton: {
    flex: 2,
  },
});
