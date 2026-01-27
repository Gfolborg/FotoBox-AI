import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  ZoomOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";

import { ThemedText } from "@/components/ThemedText";
import { GlassPill } from "@/components/GlassPill";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { PlatformChip } from "@/components/PlatformChip";
import { OptimizationPreview } from "@/components/OptimizationPreview";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { GlassCard } from "@/components/GlassCard";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getPlatformsForService,
  PlatformRequirement,
} from "@/lib/platform-requirements";
import {
  optimizeForPlatforms,
  saveOptimizedImages,
  getImageDimensions,
} from "@/lib/platform-optimizer";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PlatformSelection"
>;
type RouteProps = RouteProp<RootStackParamList, "PlatformSelection">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlatformSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri, originalUri, sourceService, backgroundColor } = route.params;

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPostSaveActions, setShowPostSaveActions] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [isDownloadingOriginal, setIsDownloadingOriginal] = useState(false);
  const [originalDownloaded, setOriginalDownloaded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [cachedShareFiles, setCachedShareFiles] = useState<
    Array<{ platformId: string; uri: string; format: string }>
  >([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const pinterestPulse = useSharedValue(1);

  const allPlatforms = getPlatformsForService(sourceService);

  // Load image dimensions on mount
  useEffect(() => {
    const loadDimensions = async () => {
      try {
        const dimensions = await getImageDimensions(imageUri);
        setImageDimensions(dimensions);
      } catch (error) {
        console.error(
          "[PlatformSelection] Failed to get image dimensions:",
          error,
        );
      }
    };
    loadDimensions();
  }, [imageUri]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platformId)) {
        newSet.delete(platformId);
      } else {
        newSet.add(platformId);
      }
      return newSet;
    });
  };

  const getSelectedRequirements = (): PlatformRequirement[] => {
    return allPlatforms.filter((p) => selectedPlatforms.has(p.id));
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Save original image without optimization
    setIsExporting(true);
    try {
      const result = await saveToFotoBoxAlbum(imageUri, "product_image");
      if (result.success) {
        setExportCount(1);
        setShowSuccess(true);
        setShowPostSaveActions(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Save Failed",
            result.error || "Could not save the image.",
          );
        }
      }
    } catch (error) {
      console.error("[PlatformSelection] Skip save failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to save image. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadOriginal = async () => {
    if (isDownloadingOriginal) return;
    setIsDownloadingOriginal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await saveToFotoBoxAlbum(imageUri, "product_image");
      if (result.success) {
        setOriginalDownloaded(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (Platform.OS !== "web") {
        Alert.alert("Save Failed", result.error || "Could not save the image.");
      }
    } catch (error) {
      console.error("[PlatformSelection] Download original failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to save image. Please try again.");
      }
    } finally {
      setIsDownloadingOriginal(false);
    }
  };

  const handleShareOriginal = async () => {
    if (isSharing) return;
    setIsSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (cachedShareFiles.length > 0) {
        if (cachedShareFiles.length === 1) {
          const only = cachedShareFiles[0];
          const fileUri = only.uri;
          if (Sharing.isAvailableAsync && (await Sharing.isAvailableAsync())) {
            await Sharing.shareAsync(fileUri, {
              mimeType:
                only.format === "PNG" ? "image/png" : "image/jpeg",
              dialogTitle: "Share Export",
            });
            return;
          }

          let shareUri = fileUri;
          if (Platform.OS === "android" && shareUri.startsWith("file://")) {
            shareUri = await FileSystem.getContentUriAsync(shareUri);
          }
          await Share.share({ url: shareUri });
          return;
        }

        const zip = new JSZip();
        for (const item of cachedShareFiles) {
          let fileUri = item.uri;
          if (!fileUri.startsWith("file://") && fileUri.startsWith("/")) {
            fileUri = `file://${fileUri}`;
          }
          const base64Data = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const ext = item.format === "PNG" ? "png" : "jpg";
          zip.file(`fotobox_${item.platformId}.${ext}`, base64Data, {
            base64: true,
          });
        }

        const zipBase64 = await zip.generateAsync({ type: "base64" });
        const zipPath = `${FileSystem.cacheDirectory}fotobox_export_${Date.now()}.zip`;
        await FileSystem.writeAsStringAsync(zipPath, zipBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (Sharing.isAvailableAsync && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(zipPath, {
            mimeType: "application/zip",
            dialogTitle: "Share Export (ZIP)",
          });
          return;
        }

        let shareUri = zipPath;
        if (Platform.OS === "android" && shareUri.startsWith("file://")) {
          shareUri = await FileSystem.getContentUriAsync(shareUri);
        }
        await Share.share({ url: shareUri });
        return;
      }

      let shareUri = imageUri;
      if (shareUri.startsWith("data:")) {
        const base64Data = shareUri.split(",")[1];
        const filename = `fotobox_${Date.now()}.jpg`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        shareUri = fileUri;
      } else if (shareUri.startsWith("/")) {
        shareUri = `file://${shareUri}`;
      }

      if (Sharing.isAvailableAsync && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(shareUri, {
          mimeType: "image/jpeg",
          dialogTitle: "Share Export",
        });
        return;
      }

      if (Platform.OS === "android" && shareUri.startsWith("file://")) {
        shareUri = await FileSystem.getContentUriAsync(shareUri);
      }

      await Share.share({ url: shareUri });
    } catch (error) {
      console.error("[PlatformSelection] Share failed:", error);
      try {
        let fallbackUri = imageUri;
        if (fallbackUri.startsWith("data:")) {
          const base64Data = fallbackUri.split(",")[1];
          const filename = `share_${Date.now()}.jpg`;
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fallbackUri = fileUri;
        } else if (fallbackUri.startsWith("/")) {
          fallbackUri = `file://${fallbackUri}`;
        }
        if (Platform.OS === "android" && fallbackUri.startsWith("file://")) {
          fallbackUri = await FileSystem.getContentUriAsync(fallbackUri);
        }
        await Share.share({ url: fallbackUri });
      } catch {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Share Failed",
            "Please rebuild the app to enable sharing, or download and share from your gallery.",
          );
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    pinterestPulse.value = withRepeat(
      withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pinterestPulse]);

  const pinterestPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinterestPulse.value }],
  }));
  const pinterestRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinterestPulse.value }],
    opacity: 2 - pinterestPulse.value,
  }));

  const handleExport = async () => {
    if (selectedPlatforms.size === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      if (Platform.OS !== "web") {
        Alert.alert(
          "No Platforms Selected",
          "Please select at least one platform to export for.",
        );
      }
      return;
    }

    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const platforms = getSelectedRequirements();

      // Optimize for all selected platforms
      const optimizedImages = await optimizeForPlatforms(
        imageUri,
        platforms,
        undefined,
        { backgroundColor },
      );

      const cacheFiles: Array<{
        platformId: string;
        uri: string;
        format: string;
      }> = [];
      for (const [platformId, result] of optimizedImages.entries()) {
        const base64Data = result.uri.split(",")[1];
        const ext = result.format === "PNG" ? "png" : "jpg";
        const fileUri = `${FileSystem.cacheDirectory}fotobox_${platformId}_${Date.now()}.${ext}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        cacheFiles.push({ platformId, uri: fileUri, format: result.format });
      }
      setCachedShareFiles(cacheFiles);

      // Save all optimized images
      const saveResult = await saveOptimizedImages(optimizedImages);

      if (saveResult.successful > 0) {
        setExportCount(saveResult.successful);
        setShowSuccess(true);
        setShowPostSaveActions(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (saveResult.failed > 0) {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Partial Export",
            `${saveResult.successful} images saved successfully, ${saveResult.failed} failed.`,
          );
        }
      }
    } catch (error) {
      console.error("[PlatformSelection] Export failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert(
          "Export Failed",
          "Failed to export images. Please try again.",
        );
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setShowPostSaveActions(false);
    navigation.popToTop();
  };

  const handlePostSaveAction = async (
    action: "background" | "mockup" | "lifestyle" | "share" | "download",
  ) => {
    const sourceUri = originalUri ?? imageUri;
    if (action !== "download" && action !== "share") {
      setShowSuccess(false);
      setShowPostSaveActions(false);
    }

    if (action === "share") {
      await handleShareOriginal();
      return;
    }

    if (action === "download") {
      handleDownloadOriginal();
      return;
    }

    if (action === "background") {
      navigation.replace("BackgroundColorSelection", { imageUri: sourceUri });
      return;
    }

    if (action === "mockup") {
      navigation.replace("MockupWizardImages", { imageUri: sourceUri });
      return;
    }

    navigation.replace("EnvironmentSelection", { imageUri: sourceUri });
  };

  const postSaveActions = [
    {
      key: "download",
      title: "Download Original",
      subtitle: "Save the image as‑is",
      icon: "download" as const,
      color: Colors.editing.primary,
      tint: Colors.editing.primarySubtle,
    },
    {
      key: "share",
      title: "Share Export",
      subtitle: "Send or email your image",
      icon: "share-2" as const,
      color: "#0EA5E9",
      tint: "rgba(14, 165, 233, 0.28)",
    },
    {
      key: "background",
      title: "Remove Background",
      subtitle: "Clean cutout with a solid color",
      icon: "scissors" as const,
      color: "#0EA5E9",
      tint: "rgba(14, 165, 233, 0.28)",
    },
    {
      key: "mockup",
      title: "Create Mockup",
      subtitle: "Realistic product displays",
      icon: "box" as const,
      color: "#A78BFA",
      tint: "rgba(167, 139, 250, 0.28)",
    },
    {
      key: "lifestyle",
      title: "Lifestyle Scene",
      subtitle: "Place it in a new environment",
      icon: "image" as const,
      color: "#10B981",
      tint: "rgba(16, 185, 129, 0.28)",
    },
  ];

  const availablePostSaveActions = postSaveActions.filter(
    (action) =>
      action.key !== sourceService &&
      !(originalDownloaded && action.key === "download"),
  );

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
              onPress={() => navigation.goBack()}
              disabled={isExporting}
            >
              <Feather
                name="chevron-left"
                size={24}
                color={Colors.editing.text}
              />
            </Pressable>

            <GlassPill>
              <Feather name="share" size={16} color={Colors.editing.primary} />
              <ThemedText style={styles.headerTitle}>Export</ThemedText>
            </GlassPill>

            <Pressable
              style={styles.headerButton}
              onPress={handleSkip}
              disabled={isExporting}
            >
              <ThemedText style={styles.skipText}>Skip</ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Preview */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.imagePreviewContainer}
          >
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            {imageDimensions && (
              <View style={styles.dimensionsBadge}>
                <Feather
                  name="image"
                  size={12}
                  color={Colors.editing.textSecondary}
                />
                <ThemedText style={styles.dimensionsText}>
                  {imageDimensions.width} x {imageDimensions.height}
                </ThemedText>
              </View>
            )}
          </Animated.View>

          {/* Platform Selection */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.platformSection}
          >
            <ThemedText style={styles.sectionTitle}>
              Select platforms to optimize for
            </ThemedText>

            <View style={styles.platformGrid}>
              {allPlatforms.map((platform) => {
                const isSelected = selectedPlatforms.has(platform.id);
                if (platform.id !== "pinterest") {
                  return (
                    <PlatformChip
                      key={platform.id}
                      platform={platform}
                      selected={isSelected}
                      onPress={() => togglePlatform(platform.id)}
                      disabled={isExporting}
                    />
                  );
                }

                return (
                  <View key={platform.id} style={styles.pinterestRow}>
                    <View style={styles.pinterestChipWrap}>
                      <PlatformChip
                        platform={platform}
                        selected={isSelected}
                        onPress={() => togglePlatform(platform.id)}
                        disabled={isExporting}
                      />
                      <Animated.View
                        style={[styles.pinterestRipple, pinterestRippleStyle]}
                      />
                      <Animated.View
                        style={[styles.pinterestInfoBadge, pinterestPulseStyle]}
                      >
                        <ThemedText style={styles.pinterestInfoText}>
                          !
                        </ThemedText>
                      </Animated.View>
                    </View>
                    {isSelected && (
                      <Animated.View
                        entering={FadeInUp.duration(200)}
                        style={styles.pinterestTooltipRight}
                      >
                        <View style={styles.pinterestTooltipArrowRight} />
                        <ThemedText style={styles.pinterestTooltipTitle}>
                          Heads up
                        </ThemedText>
                        <View style={styles.pinterestTooltipList}>
                          <View style={styles.pinterestTooltipRow}>
                            <View style={styles.pinterestBullet} />
                            <ThemedText style={styles.pinterestTooltipText}>
                              Pinterest crops to 2:3 (parts may be cut off).
                            </ThemedText>
                          </View>
                          <View style={styles.pinterestTooltipRow}>
                            <View style={styles.pinterestBullet} />
                            <ThemedText style={styles.pinterestTooltipText}>
                              Center the product and shoot a bit wider.
                            </ThemedText>
                          </View>
                          <View style={styles.pinterestTooltipRow}>
                            <View style={styles.pinterestBullet} />
                            <ThemedText style={styles.pinterestTooltipText}>
                              Use portrait framing when possible.
                            </ThemedText>
                          </View>
                          <View style={styles.pinterestTooltipRow}>
                            <View style={styles.pinterestBullet} />
                            <ThemedText style={styles.pinterestTooltipText}>
                              Download the original to crop it yourself.
                            </ThemedText>
                          </View>
                        </View>
                      </Animated.View>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Optimization Preview */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.previewSection}
          >
            <OptimizationPreview
              selectedPlatforms={getSelectedRequirements()}
              currentWidth={imageDimensions?.width}
              currentHeight={imageDimensions?.height}
            />
          </Animated.View>

        </ScrollView>

        {/* Export Button */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[
            styles.actionBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <View style={styles.actionBarContent}>
            <GradientButton
              title={
                isExporting
                  ? "Exporting..."
                  : selectedPlatforms.size > 0
                    ? `Optimize & Export (${selectedPlatforms.size})`
                    : "Select Platforms"
              }
              onPress={handleExport}
              disabled={isExporting || selectedPlatforms.size === 0}
              loading={isExporting}
              icon="download"
              fullWidth
            />
          </View>
        </Animated.View>

        {/* Success Animation */}
        {showSuccess && (
          <View style={styles.successOverlay}>
            <SuccessAnimation
              onComplete={() => {
                if (availablePostSaveActions.length > 0) {
                  setShowPostSaveActions(true);
                } else {
                  handleSuccessComplete();
                }
              }}
              size={140}
              delay={0}
            />
            <ThemedText style={styles.successText}>
              {exportCount} image{exportCount !== 1 ? "s" : ""} saved to FotoBox
            </ThemedText>
            {showPostSaveActions && availablePostSaveActions.length > 0 && (
              <GlassCard
                theme="dark"
                variant="solid"
                padding="lg"
                borderRadius="xl"
                style={styles.postSaveCard}
              >
                <View style={styles.postSaveActions}>
                  <ThemedText style={styles.postSaveTitle}>
                    Keep going with the same photo
                  </ThemedText>
                  {originalDownloaded && (
                    <View style={styles.downloadedBadge}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                      <ThemedText style={styles.downloadedBadgeText}>
                        Original saved
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.actionList}>
                    {availablePostSaveActions.map((action) => (
                      <AnimatedPressable
                        key={action.key}
                        layout={Layout.springify()}
                        exiting={
                          action.key === "download"
                            ? ZoomOut.duration(180)
                            : FadeOut.duration(160)
                        }
                        style={styles.actionRow}
                        onPress={() =>
                          handlePostSaveAction(
                            action.key as
                              | "background"
                              | "mockup"
                              | "lifestyle"
                              | "share",
                          )
                        }
                        disabled={isSharing && action.key === "share"}
                      >
                        <View
                          style={[
                            styles.actionIcon,
                            { backgroundColor: action.tint },
                          ]}
                        >
                          {action.key === "share" && isSharing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Feather
                              name={action.icon}
                              size={18}
                              color={action.color}
                            />
                          )}
                        </View>
                        <View style={styles.actionCopy}>
                          <ThemedText style={styles.actionTitle}>
                            {action.title}
                          </ThemedText>
                          <ThemedText style={styles.actionSubtitle}>
                            {action.subtitle}
                          </ThemedText>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={18}
                          color="#FFFFFF"
                        />
                      </AnimatedPressable>
                    ))}
                  </View>
                  <GradientButton
                    title="Done"
                    onPress={handleSuccessComplete}
                    variant="glass"
                    size="sm"
                    fullWidth
                    style={styles.doneButton}
                  />
                </View>
              </GlassCard>
            )}
          </View>
        )}
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
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  imagePreviewContainer: {
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.lg,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dimensionsBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  dimensionsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  platformSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.editing.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  pinterestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pinterestChipWrap: {
    position: "relative",
    alignItems: "center",
  },
  pinterestInfoBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.editing.backgroundDefault,
  },
  pinterestRipple: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.45)",
  },
  pinterestInfoText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 14,
  },
  pinterestTooltipRight: {
    maxWidth: 190,
    minWidth: 150,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    position: "relative",
    flexShrink: 1,
    alignSelf: "flex-start",
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  pinterestTooltipTitle: {
    color: Colors.editing.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  pinterestTooltipText: {
    color: Colors.editing.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 1,
  },
  pinterestTooltipList: {
    gap: 4,
  },
  pinterestTooltipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  pinterestBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    backgroundColor: "#FDBA74",
  },
  pinterestTooltipArrowRight: {
    position: "absolute",
    left: -6,
    top: 16,
    width: 10,
    height: 10,
    backgroundColor: "#FFF7ED",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#FDBA74",
    transform: [{ rotate: "45deg" }],
  },
  previewSection: {
    marginTop: Spacing.xl,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    zIndex: 1000,
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  postSaveActions: {
    width: "100%",
    gap: Spacing.md,
  },
  postSaveCard: {
    marginTop: Spacing.lg,
    width: "100%",
    maxWidth: 380,
  },
  postSaveTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  actionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  downloadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(16, 185, 129, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.6)",
  },
  downloadedBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    width: "48%",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: {
    width: "100%",
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  actionSubtitle: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: 13,
    marginTop: 2,
  },
  doneButton: {
    marginTop: Spacing.sm,
  },
});
