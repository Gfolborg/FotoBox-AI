import React, { useState } from "react";
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
import { GlassCard } from "@/components/GlassCard";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getAllPlatforms,
  PlatformRequirement,
} from "@/lib/platform-requirements";
import { batchOptimizeAndSave } from "@/lib/platform-optimizer";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchPlatformSelection"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchPlatformSelection">;

export default function BatchPlatformSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { results } = route.params;

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [currentProgress, setCurrentProgress] = useState<{
    image: number;
    platform: string;
  } | null>(null);

  const allPlatforms = getAllPlatforms();
  const imageCount = results.length;

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
      for (const result of results) {
        if (result.resultUri) {
          const saveResult = await saveToFotoBoxAlbum(
            result.resultUri,
            "product_image",
          );
          if (saveResult.success) {
            savedCount++;
          }
        }
      }

      if (savedCount > 0) {
        setExportCount(savedCount);
        setShowSuccess(true);
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
      const imageUris = results
        .filter((r) => r.resultUri)
        .map((r) => r.resultUri);

      const saveResult = await batchOptimizeAndSave(
        imageUris,
        platforms,
        (imageIndex, platformId, status) => {
          setCurrentProgress({
            image: imageIndex + 1,
            platform: platformId,
          });
        },
      );

      if (saveResult.totalSaved > 0) {
        setExportCount(saveResult.totalSaved);
        setShowSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    navigation.popToTop();
  };

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
              onComplete={handleSuccessComplete}
              size={140}
              delay={0}
            />
            <ThemedText style={styles.successText}>
              {exportCount} image{exportCount !== 1 ? "s" : ""} saved to FotoBox
            </ThemedText>
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
    zIndex: 1000,
  },
  successText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
});
