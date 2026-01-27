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
import { GlassCard } from "@/components/GlassCard";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getPlatformsForService,
  PlatformRequirement,
} from "@/lib/platform-requirements";
import { batchOptimizeAndSave, optimizeForPlatform } from "@/lib/platform-optimizer";
import { saveToFotoBoxAlbum, ensureMediaLibraryPermission } from "@/lib/save-to-album";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchPlatformSelection"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchPlatformSelection">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BatchPlatformSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { results, sourceService } = route.params;

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPostSaveActions, setShowPostSaveActions] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [isDownloadingOriginal, setIsDownloadingOriginal] = useState(false);
  const [originalDownloaded, setOriginalDownloaded] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{
    image: number;
    platform: string;
  } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [cachedShareFiles, setCachedShareFiles] = useState<
    Array<{ imageIndex: number; platformId: string; uri: string; format: string }>
  >([]);

  const pinterestPulse = useSharedValue(1);

  const allPlatforms = getPlatformsForService(sourceService);
  const imageCount = results.length;
  const canShareSingle = results.length === 1;

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

  const getTotalExports = (): number => {
    return imageCount * selectedPlatforms.size;
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Save original images without optimization
    setIsExporting(true);
    let savedCount = 0;

    try {
      const hasPermission = await ensureMediaLibraryPermission();
      if (!hasPermission) {
        throw new Error("Permission to access gallery was denied");
      }

      for (const result of results) {
        if (result.resultUri) {
          const saveResult = await saveToFotoBoxAlbum(
            result.resultUri,
            "product_image",
            { skipPermissionCheck: true },
          );
          if (saveResult.success) {
            savedCount++;
          }
        }
      }

      if (savedCount > 0) {
        setExportCount(savedCount);
        setShowSuccess(true);
        setShowPostSaveActions(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[BatchPlatformSelection] Skip save failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to save images. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadOriginals = async () => {
    if (isDownloadingOriginal) return;
    setIsDownloadingOriginal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const hasPermission = await ensureMediaLibraryPermission();
      if (!hasPermission) {
        throw new Error("Permission to access gallery was denied");
      }

      for (const result of results) {
        if (result.resultUri) {
          await saveToFotoBoxAlbum(result.resultUri, "product_image", {
            skipPermissionCheck: true,
          });
        }
      }

      setOriginalDownloaded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[BatchPlatformSelection] Download originals failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Failed to save images. Please try again.");
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
      const shareItems = results.filter((r) => r.resultUri || r.originalUri);
      if (shareItems.length === 0) return;

      if (cachedShareFiles.length > 0) {
        if (cachedShareFiles.length === 1) {
          const single = cachedShareFiles[0];
          let shareUri = single.uri;
          if (Sharing.isAvailableAsync && (await Sharing.isAvailableAsync())) {
            await Sharing.shareAsync(shareUri, {
              mimeType: single.format === "PNG" ? "image/png" : "image/jpeg",
              dialogTitle: "Share Export",
            });
            return;
          }
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
          zip.file(
            `fotobox_${item.imageIndex + 1}_${item.platformId}.${ext}`,
            base64Data,
            { base64: true },
          );
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

      if (shareItems.length === 1) {
        const target = shareItems[0].resultUri || shareItems[0].originalUri;
        if (!target) return;
        let shareUri = target;
        if (shareUri.startsWith("data:")) {
          const base64Data = shareUri.split(",")[1];
          const filename = `share_${Date.now()}.jpg`;
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
        return;
      }

      const selectedPlatformList = getSelectedRequirements();
      const zip = new JSZip();
      let fileIndex = 1;
      for (const item of shareItems) {
        const uri = item.resultUri || item.originalUri;
        if (!uri) continue;

        if (selectedPlatformList.length > 0) {
          for (const platform of selectedPlatformList) {
            const optimized = await optimizeForPlatform(uri, platform, {
              backgroundColor: item.backgroundColor,
            });
            const base64Data = optimized.uri.split(",")[1];
            const ext = optimized.format === "PNG" ? "png" : "jpg";
            zip.file(
              `fotobox_${fileIndex}_${platform.id}.${ext}`,
              base64Data,
              { base64: true },
            );
          }
        } else {
          if (uri.startsWith("data:")) {
            const base64Data = uri.split(",")[1];
            zip.file(`fotobox_${fileIndex}.jpg`, base64Data, { base64: true });
          } else {
            let fileUri = uri;
            if (!fileUri.startsWith("file://") && fileUri.startsWith("/")) {
              fileUri = `file://${fileUri}`;
            }
            const base64Data = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            zip.file(`fotobox_${fileIndex}.jpg`, base64Data, { base64: true });
          }
        }

        fileIndex += 1;
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
    } catch (error) {
      console.error("[BatchPlatformSelection] Share failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Share Failed", "Could not share the images.");
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
      const exportItems = results
        .filter((r) => r.resultUri)
        .map((r) => ({
          uri: r.resultUri as string,
          backgroundColor: r.backgroundColor,
        }));
      const imageUris = exportItems.map((item) => item.uri);
      const backgroundColors = exportItems.map((item) => item.backgroundColor);

      const saveResult = await batchOptimizeAndSave(
        imageUris,
        platforms,
        backgroundColors,
        (imageIndex, platformId, status) => {
          setCurrentProgress({
            image: imageIndex + 1,
            platform: platformId,
          });
        },
        { cacheOptimized: true },
      );

      if (saveResult.totalSaved > 0) {
        setExportCount(saveResult.totalSaved);
        setShowSuccess(true);
        setShowPostSaveActions(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (saveResult.cached) {
        setCachedShareFiles(saveResult.cached);
      }

      if (saveResult.totalFailed > 0) {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Partial Export",
            `${saveResult.totalSaved} images saved, ${saveResult.totalFailed} failed.`,
          );
        }
      }
    } catch (error) {
      console.error("[BatchPlatformSelection] Export failed:", error);
      if (Platform.OS !== "web") {
        Alert.alert(
          "Export Failed",
          "Failed to export images. Please try again.",
        );
      }
    } finally {
      setIsExporting(false);
      setCurrentProgress(null);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setShowPostSaveActions(false);
    navigation.popToTop();
  };

  const getSourceUris = (): string[] =>
    results
      .map((result) => result.originalUri || result.resultUri)
      .filter((uri): uri is string => Boolean(uri));

  const handlePostSaveAction = async (
    action: "background" | "mockup" | "lifestyle" | "share" | "download",
  ) => {
    const imageUris = getSourceUris();
    if (imageUris.length === 0) {
      handleSuccessComplete();
      return;
    }

    if (action !== "download" && action !== "share") {
      setShowSuccess(false);
      setShowPostSaveActions(false);
    }

    if (action === "share") {
      await handleShareOriginal();
      return;
    }

    if (action === "download") {
      handleDownloadOriginals();
      return;
    }

    if (action === "background") {
      navigation.replace("BatchPreview", { imageUris });
      return;
    }

    if (action === "mockup") {
      navigation.replace("MockupWizardImages", { imageUris });
      return;
    }

    navigation.replace("EnvironmentSelection", { imageUris });
  };

  const postSaveActions = [
    {
      key: "download",
      title: "Download Originals",
      subtitle: "Save images as‑is",
      icon: "download" as const,
      color: Colors.editing.primary,
      tint: Colors.editing.primarySubtle,
    },
    {
      key: "share",
      title: "Share Export",
      subtitle: "Send or email your images",
      icon: "share-2" as const,
      color: "#0EA5E9",
      tint: "rgba(14, 165, 233, 0.28)",
    },
    {
      key: "background",
      title: "Remove Backgrounds",
      subtitle: "Clean cutouts with solid colors",
      icon: "scissors" as const,
      color: "#0EA5E9",
      tint: "rgba(14, 165, 233, 0.28)",
    },
    {
      key: "mockup",
      title: "Create Mockups",
      subtitle: "Generate realistic product scenes",
      icon: "box" as const,
      color: "#A78BFA",
      tint: "rgba(167, 139, 250, 0.28)",
    },
    {
      key: "lifestyle",
      title: "Lifestyle Scenes",
      subtitle: "Place products in new environments",
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
              <ThemedText style={styles.headerTitle}>Export All</ThemedText>
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
          {/* Image Preview Grid */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.imageSection}
          >
            <View style={styles.imageGrid}>
              {results.slice(0, 4).map((result, index) => (
                <View key={index} style={styles.imageThumb}>
                  {result.resultUri && (
                    <Image
                      source={{ uri: result.resultUri }}
                      style={styles.thumbImage}
                    />
                  )}
                  {index === 3 && results.length > 4 && (
                    <View style={styles.moreOverlay}>
                      <ThemedText style={styles.moreText}>
                        +{results.length - 4}
                      </ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.countBadge}>
              <Feather name="layers" size={14} color={Colors.editing.primary} />
              <ThemedText style={styles.countText}>
                {imageCount} image{imageCount !== 1 ? "s" : ""}
              </ThemedText>
            </View>
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
                              Download originals to crop them yourself.
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

          {/* Export Summary */}
          {selectedPlatforms.size > 0 && (
            <Animated.View
              entering={FadeInUp.delay(300).duration(400)}
              style={styles.summarySection}
            >
              <GlassCard theme="light" padding="md" borderRadius="lg">
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Images</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {imageCount}
                    </ThemedText>
                  </View>
                  <Feather
                    name="x"
                    size={16}
                    color={Colors.editing.textTertiary}
                  />
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>
                      Platforms
                    </ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {selectedPlatforms.size}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.mathSymbol}>=</ThemedText>
                  <View style={styles.summaryItem}>
                    <ThemedText style={styles.summaryLabel}>Total</ThemedText>
                    <ThemedText
                      style={[styles.summaryValue, styles.summaryTotal]}
                    >
                      {getTotalExports()}
                    </ThemedText>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          )}

          {/* Progress */}
          {isExporting && currentProgress && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.progressSection}
            >
              <GlassCard theme="light" padding="md" borderRadius="lg">
                <View style={styles.progressContent}>
                  <Feather
                    name="loader"
                    size={20}
                    color={Colors.editing.primary}
                  />
                  <ThemedText style={styles.progressText}>
                    Processing image {currentProgress.image} of {imageCount} for{" "}
                    {currentProgress.platform}...
                  </ThemedText>
                </View>
              </GlassCard>
            </Animated.View>
          )}
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
                    ? `Export ${getTotalExports()} Images`
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
                    Keep going with the same photos
                  </ThemedText>
                  {originalDownloaded && (
                    <View style={styles.downloadedBadge}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                      <ThemedText style={styles.downloadedBadgeText}>
                        Originals saved
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
                              | "share"
                              | "download",
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
  imageSection: {
    alignItems: "center",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.primarySubtle,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.primary,
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
  summarySection: {
    marginTop: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.editing.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.editing.text,
  },
  summaryTotal: {
    color: Colors.editing.primary,
  },
  mathSymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.editing.textTertiary,
  },
  progressSection: {
    marginTop: Spacing.lg,
  },
  progressContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressText: {
    flex: 1,
    fontSize: 13,
    color: Colors.editing.textSecondary,
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
    maxWidth: 420,
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
