import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Platform,
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
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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
  getAllPlatforms,
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

export default function PlatformSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { imageUri, originalUri, sourceService } = route.params;

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPostSaveActions, setShowPostSaveActions] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const allPlatforms = getAllPlatforms();

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
      const optimizedImages = await optimizeForPlatforms(imageUri, platforms);

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

  const handlePostSaveAction = (
    action: "background" | "mockup" | "lifestyle",
  ) => {
    const sourceUri = originalUri ?? imageUri;
    setShowSuccess(false);
    setShowPostSaveActions(false);

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
    (action) => action.key !== sourceService,
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
              {allPlatforms.map((platform) => (
                <PlatformChip
                  key={platform.id}
                  platform={platform}
                  selected={selectedPlatforms.has(platform.id)}
                  onPress={() => togglePlatform(platform.id)}
                  disabled={isExporting}
                />
              ))}
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
                  <View style={styles.actionList}>
                    {availablePostSaveActions.map((action) => (
                      <Pressable
                        key={action.key}
                        style={styles.actionRow}
                        onPress={() =>
                          handlePostSaveAction(
                            action.key as "background" | "mockup" | "lifestyle",
                          )
                        }
                      >
                        <View
                          style={[
                            styles.actionIcon,
                            { backgroundColor: action.tint },
                          ]}
                        >
                          <Feather
                            name={action.icon}
                            size={18}
                            color={action.color}
                          />
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
                      </Pressable>
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
    gap: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
    flex: 1,
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
