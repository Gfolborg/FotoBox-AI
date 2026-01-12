import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { SkiaEditableImage } from "@/components/SkiaEditableImage";
import { DialToolbar } from "@/components/DialToolbar";
import { SavePresetModal } from "@/components/SavePresetModal";
import { Colors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { useImageEditing } from "@/hooks/useImageEditing";
import { usePresets } from "@/hooks/usePresets";
import { getPresetById } from "@/lib/preset-storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "EditImage">;
type EditImageRouteProp = RouteProp<RootStackParamList, "EditImage">;

export default function EditImageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditImageRouteProp>();
  const { imageUri, presetId } = route.params;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);

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
  }, [presetId]);

  const handleSavePreset = async (name: string) => {
    try {
      await saveCurrentAsPreset(name, state);
      Alert.alert("Preset Saved", `"${name}" has been saved to your presets.`);
    } catch (err) {
      Alert.alert("Error", "Failed to save preset. Please try again.");
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
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

  const handleGenerateAmazonMain = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(state.selectedBackgroundColor);
      const endpoint = `${apiUrl}api/amazon-main?backgroundColor=${bgColorParam}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

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
      
      reader.onerror = () => {
        throw new Error("Failed to read processed image");
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      let errorMessage = "An unexpected error occurred";
      
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes("Network request failed") || err.message.includes("TypeError")) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      if (Platform.OS !== "web") {
        Alert.alert("Processing Failed", errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "image-to-edit.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const params = new URLSearchParams({
        brightness: state.brightness.toString(),
        contrast: state.contrast.toString(),
        saturation: state.saturation.toString(),
        rotation: state.rotation.toString(),
        exposure: state.exposure.toString(),
        highlights: state.highlights.toString(),
        shadows: state.shadows.toString(),
        warmth: state.warmth.toString(),
        flipHorizontal: state.flipHorizontal.toString(),
        flipVertical: state.flipVertical.toString(),
      });

      // Add crop params if crop is set
      if (state.crop) {
        params.append("cropX", state.crop.x.toString());
        params.append("cropY", state.crop.y.toString());
        params.append("cropWidth", state.crop.width.toString());
        params.append("cropHeight", state.crop.height.toString());
      }

      const endpoint = `${apiUrl}api/edit-image?${params.toString()}`;

      console.log("[EditImageScreen] Applying edits:", state);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to edit image");
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const base64data = reader.result as string;
        // Navigate back to Result screen with edited image
        navigation.replace("Result", {
          resultUri: base64data,
          originalUri: route.params.originalUri || imageUri,
        });
      };

      reader.onerror = () => {
        throw new Error("Failed to read edited image");
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      let errorMessage = "Failed to edit image";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      if (Platform.OS !== "web") {
        Alert.alert("Edit Failed", errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Show crop overlay only when crop tool is actively selected
  const showCropOverlay = state.activeTab === "crop";

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: Spacing.xs }]}>
        {/* Image Preview with Real-time Skia Filters */}
        <SkiaEditableImage
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

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <ThemedText style={styles.processingText}>
                Processing your image...
              </ThemedText>
              <ThemedText style={styles.processingHint}>
                This may take up to 30 seconds
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Dial Toolbar */}
      <DialToolbar
        state={state}
        onUpdateAdjustment={updateAdjustment}
        onRotateCW={rotateCW}
        onRotateCCW={rotateCCW}
        onToggleFlipHorizontal={toggleFlipHorizontal}
        onToggleFlipVertical={toggleFlipVertical}
        onGenerate={handleGenerateAmazonMain}
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

        <Button
          onPress={handleDone}
          disabled={isProcessing}
          variant="primary"
        >
          {isProcessing ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator color={Colors.light.buttonText} size="small" />
              <ThemedText style={styles.doneButtonText}>Processing...</ThemedText>
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
  errorContainer: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.light.error + "15",
    borderRadius: 8,
  },
  errorText: {
    color: Colors.light.error,
    textAlign: "center",
    fontSize: 14,
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
});
