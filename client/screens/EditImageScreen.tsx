import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import {
  SkiaEditableImage,
  SkiaEditableImageRef,
} from "@/components/SkiaEditableImage";
import { DialToolbar } from "@/components/DialToolbar";
import { SavePresetModal } from "@/components/SavePresetModal";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { useImageEditing } from "@/hooks/useImageEditing";
import { usePresets } from "@/hooks/usePresets";
import { getPresetById } from "@/lib/preset-storage";
import { useNotification } from "@/context/NotificationContext";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditImage"
>;
type EditImageRouteProp = RouteProp<RootStackParamList, "EditImage">;

export default function EditImageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditImageRouteProp>();
  const { showNotification } = useNotification();
  const { imageUri, presetId } = route.params;

  const imageRef = useRef<SkiaEditableImageRef>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("amazon");

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

  // Load preset if provided
  useEffect(() => {
    if (presetId) {
      getPresetById(presetId).then((preset) => {
        if (preset) {
          applyPresetToState(preset, updateAdjustment);
        }
      });
    }
    // Only re-run when presetId changes, not when helper functions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetId]);

  const handleSavePreset = async (name: string) => {
    try {
      await saveCurrentAsPreset(name, state);
      showNotification(
        `"${name}" has been saved to your presets.`,
        "success",
      );
    } catch {
      showNotification("Failed to save preset. Please try again.", "error");
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ThemedText style={styles.headerButtonText}>Cancel</ThemedText>
        </Button>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Pressable
            onPressIn={toggleBeforeAfter}
            onPressOut={toggleBeforeAfter}
            hitSlop={8}
          >
            <ThemedText style={styles.headerButtonText}>Compare</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setShowSavePresetModal(true)}
            hitSlop={8}
            style={styles.bookmarkButton}
          >
            <Feather name="bookmark" size={22} color={Colors.light.primary} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, toggleBeforeAfter]);

  // This function still needs to exist for the AI-specific generation
  const handleGenerateMainImage = async () => { // Renamed function
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(state.selectedBackgroundColor);
      // Pass selectedPlatform to the endpoint
      const endpoint = `${apiUrl}api/main-image?platform=${selectedPlatform}&backgroundColor=${bgColorParam}`;

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

  // NEW: Client-side rendering for non-AI edits
  const handleDone = async () => {
    if (!imageRef.current) {
      showNotification("An unexpected error occurred. Please try again.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Take snapshot using the component's method
      const base64data = await imageRef.current.snapshot();

      // 2. Navigate to result screen with the new image data
      navigation.replace("Result", {
        resultUri: base64data,
        originalUri: route.params.originalUri || imageUri,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save image";
      showNotification(errorMessage, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show crop overlay only when crop tool is actively selected
  const showCropOverlay = state.activeTab === "crop";

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.content, { paddingTop: Spacing.xs }]}
      >
        {/* Image Preview with Real-time Skia Filters */}
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
          showCropOverlay={showCropOverlay}
          crop={state.crop}
          onCropChange={(crop) => updateAdjustment("crop", crop)}
        />

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <ThemedText style={styles.processingText}>
                Processing your image...
              </ThemedText>
              <ThemedText style={styles.processingHint}>
                This may take a moment
              </ThemedText>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Platform Selection */}
      <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.platformSelectionContainer}>
        <ThemedText style={styles.platformSelectionTitle}>Target Platform</ThemedText>
        <View style={styles.platformChipsContainer}>
          {["amazon", "shopify", "etsy"].map((platform) => (
            <Pressable
              key={platform}
              style={[
                styles.platformChip,
                selectedPlatform === platform && styles.platformChipSelected,
              ]}
              onPress={() => setSelectedPlatform(platform)}
            >
              <ThemedText
                style={[
                  styles.platformChipText,
                  selectedPlatform === platform && styles.platformChipTextSelected,
                ]}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Dial Toolbar */}
      <DialToolbar
        state={state}
        onUpdateAdjustment={updateAdjustment}
        onRotateCW={rotateCW}
        onRotateCCW={rotateCCW}
        onToggleFlipHorizontal={toggleFlipHorizontal}
        onToggleFlipVertical={toggleFlipVertical}
        onGenerate={handleGenerateMainImage} // Updated function name
        isProcessing={isProcessing}
      />

      {/* Action Buttons */}
      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        <Button
          onPress={resetAll}
          variant="outline"
          disabled={isProcessing || !hasChanges()}
        >
          Reset
        </Button>


        <Button onPress={handleDone} disabled={isProcessing} variant="primary">
          {isProcessing ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={Colors.light.buttonText} size="small" />
              <ThemedText style={styles.doneButtonText}>
                Saving...
              </ThemedText>
            </View>
          ) : (
            "Done"
          )}
        </Button>
      </View>

      {/* Save Preset Modal */}
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
        aiSettings={{ // Pass AI-related settings
          environment: state.aiEnvironment,
          isCustom: state.aiIsCustom,
          productDescription: state.aiProductDescription,
          shadowControl: state.aiShadowControl,
        }}
        isSaving={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  headerButtonText: {
    color: Colors.light.primary,
    fontWeight: "500",
    fontSize: 16,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  bookmarkButton: {
    padding: Spacing.xs,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  processingCard: {
    backgroundColor: Colors.light.backgroundRoot,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    gap: Spacing.md,
    minWidth: 200,
  },
  processingText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  processingHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundRoot,
  },
  doneButtonText: {
    color: Colors.light.buttonText,
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  platformSelectionContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.backgroundRoot,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    alignItems: "center",
  },
  platformSelectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  platformChipsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  platformChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  platformChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  platformChipText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  platformChipTextSelected: {
    color: Colors.light.buttonText,
    fontWeight: "600",
  },
});
