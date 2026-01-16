import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { GradientButton } from "@/components/GradientButton";
import { IconButton } from "@/components/IconButton";
import { GlassPill } from "@/components/GlassPill";
import { ProgressRing } from "@/components/ProgressRing";
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

  const handleDone = async () => {
    if (!imageRef.current) {
      showNotification("An unexpected error occurred. Please try again.", "error");
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const base64data = await imageRef.current.snapshot();
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

  const showCropOverlay = state.activeTab === "crop";

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Custom Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <BlurView intensity={40} tint="dark" style={styles.headerBlur} />
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

      {/* Image Preview */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.imageContainer}
      >
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
            <BlurView intensity={60} tint="dark" style={styles.processingBlur} />
            <View style={styles.processingContent}>
              <ProgressRing
                progress={0.7}
                size={72}
                strokeWidth={5}
                color={Colors.editing.primary}
                backgroundColor="rgba(255, 255, 255, 0.1)"
              >
                <Feather name="cpu" size={24} color={Colors.editing.primary} />
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

      {/* Dial Toolbar */}
      <DialToolbar
        state={state}
        onUpdateAdjustment={updateAdjustment}
        onRotateCW={rotateCW}
        onRotateCCW={rotateCCW}
        onToggleFlipHorizontal={toggleFlipHorizontal}
        onToggleFlipVertical={toggleFlipVertical}
      />

      {/* Bottom Action Bar */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={[styles.bottomActionBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BlurView intensity={40} tint="dark" style={styles.buttonBlur} />
        <View style={styles.actionBarContent}>
          {/* Platform Selection Row */}
          <View style={styles.platformRow}>
            <ThemedText style={styles.platformLabel}>Platform</ThemedText>
            <View style={styles.platformChips}>
              {["amazon", "shopify", "etsy"].map((platform) => (
                <Pressable
                  key={platform}
                  style={[
                    styles.platformChip,
                    selectedPlatform === platform && styles.platformChipActive,
                  ]}
                  onPress={() => {
                    setSelectedPlatform(platform);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.platformChipText,
                      selectedPlatform === platform && styles.platformChipTextActive,
                    ]}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Action Buttons Row */}
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
        aiSettings={{
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
    backgroundColor: Colors.editing.backgroundRoot,
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
    marginTop: 100,
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
    backgroundColor: "rgba(26, 26, 26, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  platformChips: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  platformChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  platformChipActive: {
    backgroundColor: Colors.editing.primary,
    borderColor: Colors.editing.primary,
  },
  platformChipText: {
    color: Colors.editing.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  platformChipTextActive: {
    color: Colors.editing.buttonText,
    fontWeight: "600",
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
