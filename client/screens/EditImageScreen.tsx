import * as React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { ProgressRing } from "@/components/ProgressRing";
import {
  CompactToolbar,
  ADJUSTMENT_TOOLS,
  ToolConfig,
} from "@/components/CompactToolbar";
import { SavePresetModal } from "@/components/SavePresetModal";
import { SaveOrEnhanceModal } from "@/components/SaveOrEnhanceModal";
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
import { useBatchEdit } from "@/context/BatchEditContext";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";
import { buildMockupWizardState } from "@/lib/mockup-templates";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const DRAG_SENSITIVITY = 0.004;

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditImage"
>;
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
  | "flip";

export default function EditImageScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditImageRouteProp>();
  const { showNotification } = useNotification();
  const { setPendingEditResult } = useBatchEdit();
  const { imageUri, presetId, originalUri } = route.params;

  const imageRef = React.useRef<SkiaEditableImageRef>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = React.useState(false);
  const [showSaveOrEnhanceModal, setShowSaveOrEnhanceModal] =
    React.useState(false);
  const [editedImageUri, setEditedImageUri] = React.useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState<ToolKey | null>(
    "brightness",
  );
  const [isToolbarHidden, setIsToolbarHidden] = React.useState(false);
  const [preparedUri, setPreparedUri] = React.useState<string | null>(null);
  const [currentImageUri, setCurrentImageUri] = React.useState<string | null>(
    null,
  ); // Track current image (original or cropped)
  const [imageLayout, setImageLayout] = React.useState({ width: 0, height: 0 });

  // Dynamic image sizing - calculate max constraints based on screen
  const imageMaxWidth = SCREEN_WIDTH - Spacing.lg * 2; // Account for padding
  const imageMaxHeight = SCREEN_HEIGHT * 0.45; // Leave room for toolbar and buttons

  // Prepare image for Skia compatibility on mount
  // Uses same approach as QuickFixScreen for consistency
  React.useEffect(() => {
    const prepareImage = async () => {
      try {
        // If already a data URI, use directly
        if (imageUri.startsWith("data:")) {
          setPreparedUri(imageUri);
          setCurrentImageUri(imageUri);
          return;
        }

        // Convert to a clean file URI that Skia can load
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [],
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
        );

        // Ensure URI has file:// prefix for Skia compatibility
        let fileUri = manipResult.uri;
        if (!fileUri.startsWith("file://") && !fileUri.startsWith("data:")) {
          fileUri = `file://${fileUri}`;
        }

        setPreparedUri(fileUri);
        setCurrentImageUri(fileUri);
      } catch (error) {
        console.error("[EditImageScreen] Failed to prepare image:", error);
        // Fallback: try the original URI as-is
        setPreparedUri(imageUri);
        setCurrentImageUri(imageUri);
      }
    };

    prepareImage();
  }, [imageUri]);

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

  const {
    saveCurrentAsPreset,
    applyPresetToState,
    isSaving: isPresetSaving,
  } = usePresets();

  const isDragging = useSharedValue(false);
  const dragStartValue = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const indicatorScale = useSharedValue(0.8);
  const currentDisplayValue = useSharedValue("");

  React.useEffect(() => {
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

  const handleDone = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (!imageRef.current) {
        showNotification("Image not ready. Please try again.", "error");
        return;
      }

      // Take snapshot with all edits applied (no API call)
      const snapshotUri = await imageRef.current.snapshot();

      if (!snapshotUri || !snapshotUri.startsWith("data:image/")) {
        showNotification("Failed to process image.", "error");
        return;
      }

      // Store the edited result in context and go back to previous screen
      setPendingEditResult({
        originalUri: originalUri || imageUri,
        editedUri: snapshotUri,
      });
      navigation.goBack();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      showNotification(errorMessage, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!editedImageUri) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSaveOrEnhanceModal(false);

    // Navigate to platform selection for proper resizing before save
    // First, save the base64 to a temp file for the platform optimizer
    try {
      const filename = `edited_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      const base64Data = editedImageUri.split(",")[1];

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("PlatformSelection", {
        imageUri: fileUri,
        originalUri: originalUri || imageUri,
        sourceService: "edit",
      });
    } catch (error) {
      console.error("Failed to prepare image for platform selection:", error);
      showNotification("Failed to prepare image. Please try again.", "error");
    }
  };

  const handleRemoveBackground = async () => {
    if (!editedImageUri) return;

    setShowSaveOrEnhanceModal(false);

    try {
      const filename = `bg_remove_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = editedImageUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("BackgroundColorSelection", { imageUri: fileUri });
    } catch (error) {
      console.error("Failed to prepare image:", error);
      showNotification("Failed to prepare image. Please try again.", "error");
    }
  };

  const handleCreateLifestyle = async () => {
    if (!editedImageUri) return;

    setShowSaveOrEnhanceModal(false);

    try {
      const filename = `lifestyle_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = editedImageUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("EnvironmentSelection", { imageUri: fileUri });
    } catch (error) {
      console.error("Failed to prepare image:", error);
      showNotification("Failed to prepare image. Please try again.", "error");
    }
  };

  const handleCreateMockup = async () => {
    if (!editedImageUri) return;

    setShowSaveOrEnhanceModal(false);

    try {
      const filename = `mockup_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = editedImageUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      navigation.navigate("MockupWizardPath", {
        wizardState: buildMockupWizardState([fileUri]),
      });
    } catch (error) {
      console.error("Failed to prepare image:", error);
      showNotification("Failed to prepare image. Please try again.", "error");
    }
  };

  const handleBackToResults = () => {
    setShowSaveOrEnhanceModal(false);
    // Go back to the previous screen (BatchResultScreen)
    navigation.goBack();
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
      updateAdjustment(
        activeToolConfig.key as keyof typeof state,
        newValue as never,
      );
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

      // Negative translation means dragging up (increase value), positive means dragging down (decrease value)
      const delta = -event.translationY * DRAG_SENSITIVITY;
      const range = activeToolConfig.max! - activeToolConfig.min!;
      const newValue = Math.max(
        activeToolConfig.min!,
        Math.min(activeToolConfig.max!, dragStartValue.value + delta * range),
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

  const imageAnimatedStyle = useAnimatedStyle(() => ({}));

  // Show loading while image is being prepared for Skia
  if (!preparedUri || !currentImageUri) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <GradientBackground theme="home" style={styles.container}>
          <StatusBar style="dark" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.editing.primary} />
          </View>
        </GradientBackground>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GradientBackground
        theme="home"
        style={styles.container}
      >
        <StatusBar style="dark" />

        <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Pressable
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
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
            <Animated.View
              entering={FadeIn.duration(400)}
              style={[styles.imageContainer, imageAnimatedStyle]}
              onLayout={(e) => setImageLayout(e.nativeEvent.layout)}
            >
              <SkiaEditableImage
                ref={imageRef}
                originalUri={currentImageUri}
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
                showCropOverlay={false}
                crop={state.crop}
                aspectRatio={state.aspectRatio}
                onCropChange={() => {}}
                maxWidth={imageMaxWidth}
                maxHeight={imageMaxHeight}
              />

              <Animated.View
                style={[styles.valueIndicator, indicatorStyle]}
                pointerEvents="none"
              >
                <View style={styles.indicatorContent}>
                  <ThemedText style={styles.indicatorLabel}>
                    {activeToolConfig?.label || ""}
                  </ThemedText>
                  <ThemedText style={styles.indicatorValue}>
                    {activeToolConfig?.format
                      ? activeToolConfig.format(currentValue)
                      : ""}
                  </ThemedText>
                </View>
              </Animated.View>

              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <BlurView
                    intensity={60}
                    tint="light"
                    style={styles.processingBlur}
                  />
                  <View style={styles.processingContent}>
                    <ProgressRing
                      progress={0.7}
                      size={72}
                      strokeWidth={5}
                      color={Colors.editing.primary}
                      backgroundColor={Colors.editing.border}
                    >
                      <Feather
                        name="cpu"
                        size={24}
                        color={Colors.editing.primary}
                      />
                    </ProgressRing>
                    <ThemedText style={styles.processingText}>
                      Processing...
                    </ThemedText>
                    <ThemedText style={styles.processingHint}>
                      This may take a moment
                    </ThemedText>
                  </View>
                </View>
              )}
            </Animated.View>
          </GestureDetector>

          {/* Static Drag Hint - shown when a tool with dragging is active */}
          {activeToolConfig && (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.staticDragHint}
            >
              <Feather
                name="move"
                size={14}
                color={Colors.editing.textTertiary}
              />
              <ThemedText style={styles.staticDragHintText}>
                Drag up/down on screen to adjust
              </ThemedText>
            </Animated.View>
          )}

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
            style={[
              styles.bottomActionBar,
              { paddingBottom: insets.bottom + Spacing.md },
            ]}
          >
            <BlurView intensity={40} tint="light" style={styles.buttonBlur} />
            <View style={styles.actionBarContent}>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={resetAll}
                  disabled={isProcessing || !hasChanges()}
                  style={[
                    styles.resetIconButton,
                    (isProcessing || !hasChanges()) &&
                      styles.resetIconButtonDisabled,
                  ]}
                >
                  <Feather
                    name="rotate-ccw"
                    size={20}
                    color={
                      isProcessing || !hasChanges()
                        ? Colors.editing.textTertiary
                        : Colors.editing.text
                    }
                  />
                </Pressable>

                <GradientButton
                  title={isProcessing ? "Processing..." : "Done"}
                  onPress={handleDone}
                  disabled={isProcessing}
                  loading={isProcessing}
                  icon="check"
                  style={styles.generateButton}
                />
              </View>
            </View>
          </Animated.View>
        </View>

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
          isSaving={isPresetSaving}
        />

        <SaveOrEnhanceModal
          visible={showSaveOrEnhanceModal}
          onClose={() => setShowSaveOrEnhanceModal(false)}
          onSaveToGallery={handleSaveToGallery}
          onRemoveBackground={handleRemoveBackground}
          onCreateLifestyle={handleCreateLifestyle}
          onCreateMockup={handleCreateMockup}
          onBackToResults={originalUri ? handleBackToResults : undefined}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
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
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.editing.primary,
    ...Shadows.lg,
  },
  indicatorLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  indicatorValue: {
    color: Colors.editing.text,
    fontSize: 32,
    fontWeight: "700",
  },
  staticDragHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    alignSelf: "center",
  },
  staticDragHintText: {
    color: Colors.editing.text,
    fontSize: 14,
    fontWeight: "700",
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
    alignItems: "center",
  },
  resetIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: Colors.editing.border,
    justifyContent: "center",
    alignItems: "center",
  },
  resetIconButtonDisabled: {
    opacity: 0.5,
  },
  generateButton: {
    flex: 1,
  },
});
