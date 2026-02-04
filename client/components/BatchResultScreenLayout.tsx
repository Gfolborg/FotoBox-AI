import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Image,
  FlatList,
  Pressable,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useBatchEdit } from "@/context/BatchEditContext";
import { ProgressRing } from "@/components/ProgressRing";
import { IterateSheet } from "@/components/IterateSheet";
import { ZoomableImageModal } from "@/components/ZoomableImageModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = Spacing.lg;
const GRID_GAP = Spacing.sm;
const NUM_COLUMNS = 2;
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / NUM_COLUMNS;
const VIEWER_WIDTH = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 420);
const VIEWER_SLIDE_WIDTH = VIEWER_WIDTH - Spacing.lg * 2;
const VIEWER_MAX_HEIGHT = Dimensions.get("window").height * 0.55;

export type BatchResultItem = {
  originalUri: string;
  resultUri: string | null;
  error?: string;
  status: "pending" | "processing" | "completed" | "failed";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BatchResultScreenLayoutProps = {
  title: string;
  initialResults: BatchResultItem[];
  onExportAll: (results: { originalUri: string; resultUri: string }[]) => void;
  onRetry: (item: BatchResultItem) => Promise<string>;
  onIterate: (item: BatchResultItem, notes: string) => Promise<string>;
  onEdit: (item: BatchResultItem, resultUri: string) => void | Promise<void>;
  onNew: (item: BatchResultItem) => void;
  onDone: () => void;
};

export function BatchResultScreenLayout({
  title,
  initialResults,
  onExportAll,
  onRetry,
  onIterate,
  onEdit,
  onNew,
  onDone,
}: BatchResultScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const viewerScrollRef = React.useRef<ScrollView>(null);
  const [results, setResults] = useState(initialResults);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerDimensions, setViewerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isIterateOpen, setIsIterateOpen] = useState(false);
  const [iterateNotes, setIterateNotes] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [zoomImageUri, setZoomImageUri] = useState<string | null>(null);
  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

  useFocusEffect(
    useCallback(() => {
      if (pendingEditResult) {
        setResults((prev) =>
          prev.map((item) =>
            item.originalUri === pendingEditResult.originalUri
              ? { ...item, resultUri: pendingEditResult.editedUri, status: "completed" }
              : item,
          ),
        );
        setPendingEditResult(null);
      }
    }, [pendingEditResult, setPendingEditResult]),
  );

  const successfulResults = results.filter(
    (r) => r.status === "completed" && r.resultUri,
  );
  const failedResults = results.filter((r) => r.status === "failed");
  const selectedItem = viewerIndex !== null ? results[viewerIndex] : undefined;

  const actionCardGradients = {
    edit: ["rgba(14, 165, 233, 0.28)", "rgba(59, 130, 246, 0.45)"],
    retry: ["rgba(249, 115, 22, 0.28)", "rgba(234, 88, 12, 0.45)"],
    new: ["rgba(16, 185, 129, 0.28)", "rgba(34, 197, 94, 0.45)"],
    iterate: ["rgba(20, 184, 166, 0.25)", "rgba(13, 148, 136, 0.45)"],
  };

  const viewerHeight = viewerDimensions
    ? Math.min(
        (VIEWER_SLIDE_WIDTH * viewerDimensions.height) /
          viewerDimensions.width,
        VIEWER_MAX_HEIGHT,
      )
    : VIEWER_SLIDE_WIDTH;

  const swipeShift = useSharedValue(0);
  React.useEffect(() => {
    swipeShift.value = withRepeat(
      withTiming(6, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [swipeShift]);

  const swipeLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -swipeShift.value }],
  }));
  const swipeRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeShift.value }],
  }));

  React.useEffect(() => {
    if (selectedItem?.resultUri || selectedItem?.originalUri) {
      const uri = selectedItem.resultUri || selectedItem.originalUri;
      Image.getSize(
        uri,
        (width, height) => setViewerDimensions({ width, height }),
        () => setViewerDimensions(null),
      );
    }
  }, [selectedItem?.resultUri, selectedItem?.originalUri]);

  const handleExportAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const exportableResults = successfulResults
      .filter((r) => r.resultUri)
      .map((r) => ({
        originalUri: r.originalUri,
        resultUri: r.resultUri!,
      }));

    onExportAll(exportableResults);
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDone();
  };

  const handleOpenViewer = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerIndex(index);
    requestAnimationFrame(() => {
      viewerScrollRef.current?.scrollTo({
        x: index * VIEWER_SLIDE_WIDTH,
        animated: false,
      });
    });
  };

  const handleCloseViewer = () => {
    setViewerIndex(null);
    setIsRetrying(false);
    setIsIterateOpen(false);
  };

  const handleViewerScrollEnd = (
    event: { nativeEvent: { contentOffset: { x: number } } },
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / VIEWER_SLIDE_WIDTH,
    );
    if (nextIndex !== viewerIndex) {
      setViewerIndex(nextIndex);
    }
  };

  const handleRetrySelected = async () => {
    if (!selectedItem || isRetrying || isIterating) return;
    const targetIndex = viewerIndex;
    if (targetIndex === null) return;
    setIsRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const resultUri = await onRetry(selectedItem);
      setResults((prev) =>
        prev.map((item, idx) =>
          idx === targetIndex
            ? { ...item, resultUri, status: "completed" }
            : item,
        ),
      );
    } catch (error) {
      console.error("Batch retry failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web" && message !== "No credits remaining") {
        Alert.alert("Generation Failed", message);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleOpenIterate = () => {
    if (!selectedItem?.resultUri || isRetrying || isIterating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsIterateOpen(true);
  };

  const handleIterateSelected = async () => {
    if (!selectedItem?.resultUri || isIterating || isRetrying) return;
    const targetIndex = viewerIndex;
    if (targetIndex === null) return;
    const notes = iterateNotes.trim();
    if (!notes) return;
    setIsIterating(true);
    setIsIterateOpen(false);

    try {
      const resultUri = await onIterate(selectedItem, notes);
      setResults((prev) =>
        prev.map((item, idx) =>
          idx === targetIndex
            ? { ...item, resultUri, status: "completed" }
            : item,
        ),
      );
      setIterateNotes("");
    } catch (error) {
      console.error("Iteration failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web" && message !== "No credits remaining") {
        Alert.alert("Iteration Failed", message);
      }
    } finally {
      setIsIterating(false);
    }
  };

  const handleEditSelected = async () => {
    if (!selectedItem?.resultUri) return;
    setViewerIndex(null);
    await onEdit(selectedItem, selectedItem.resultUri);
  };

  const handleNewSelected = () => {
    if (!selectedItem) return;
    setViewerIndex(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNew(selectedItem);
  };

  const isWorking = isRetrying || isIterating;
  const workingTitle = isIterating ? "Iterating" : "Regenerating";

  const renderResultItem = ({
    item,
    index,
  }: {
    item: BatchResultItem;
    index: number;
  }) => {
    const isSuccess = item.status === "completed" && item.resultUri;

    return (
      <AnimatedPressable
        entering={FadeInDown.delay(index * 80).duration(400)}
        style={styles.resultCard}
        onPress={() => handleOpenViewer(index)}
      >
        <Image
          source={{ uri: isSuccess ? item.resultUri! : item.originalUri }}
          style={styles.resultImage}
        />
        <View
          style={[
            styles.statusBadge,
            isSuccess ? styles.successBadge : styles.failedBadge,
          ]}
        >
          <Feather
            name={isSuccess ? "check" : "x"}
            size={12}
            color={Colors.editing.text}
          />
        </View>
        {!isSuccess && (
          <View style={styles.failedOverlay}>
            <ThemedText style={styles.failedText}>Failed</ThemedText>
          </View>
        )}
        <View
          style={[
            styles.tapBadge,
            isSuccess ? styles.tapBadgeSuccess : styles.tapBadgeRetry,
          ]}
        >
          <Feather
            name={isSuccess ? "edit-2" : "refresh-cw"}
            size={12}
            color="#FFFFFF"
          />
          <ThemedText style={styles.tapBadgeText}>
            {isSuccess ? "Tap for options" : "Tap to retry"}
          </ThemedText>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ width: 44 }} />
            <View style={styles.headerCenter}>
              <ThemedText style={styles.headerTitle}>{title}</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                {successfulResults.length} of {results.length} successful
              </ThemedText>
            </View>
            <Pressable style={styles.closeButton} onPress={handleDone}>
              <Feather name="x" size={24} color={Colors.editing.text} />
            </Pressable>
          </View>
        </Animated.View>

        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(_, index) => index.toString()}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          style={styles.grid}
        />

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <GlassCard theme="light" padding="sm" borderRadius="lg">
            <View style={styles.bottomContent}>
              {failedResults.length > 0 && (
                <View style={styles.warningRow}>
                  <Feather
                    name="alert-circle"
                    size={16}
                    color={Colors.editing.error}
                  />
                  <ThemedText style={styles.warningText}>
                    {failedResults.length} image
                    {failedResults.length > 1 ? "s" : ""} failed
                  </ThemedText>
                </View>
              )}
              <View style={styles.buttonRow}>
                <GradientButton
                  title={`Save All (${successfulResults.length})`}
                  onPress={handleExportAll}
                  disabled={successfulResults.length === 0}
                  icon="download"
                  fullWidth
                />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {selectedItem && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.viewerOverlay}>
            <Pressable style={styles.viewerBackdrop} onPress={handleCloseViewer} />
            <View style={styles.viewerContent}>
              <View style={styles.viewerHeader}>
                <ThemedText style={styles.viewerTitle}>
                  {viewerIndex! + 1} of {results.length}
                </ThemedText>
                <Pressable style={styles.viewerClose} onPress={handleCloseViewer}>
                  <Feather name="x" size={22} color={Colors.editing.text} />
                </Pressable>
              </View>
              <View style={styles.swipeHint}>
                <View style={styles.swipePill}>
                  <Animated.View style={swipeLeftStyle}>
                    <Feather
                      name="chevrons-left"
                      size={18}
                      color={Colors.editing.text}
                    />
                  </Animated.View>
                  <ThemedText style={styles.swipeHintText}>
                    Swipe to browse
                  </ThemedText>
                  <Animated.View style={swipeRightStyle}>
                    <Feather
                      name="chevrons-right"
                      size={18}
                      color={Colors.editing.text}
                    />
                  </Animated.View>
                </View>
              </View>

              <ScrollView
                ref={viewerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleViewerScrollEnd}
                contentContainerStyle={styles.viewerCarousel}
              >
                {results.map((item, index) => (
                  <View key={item.originalUri + index} style={styles.viewerSlide}>
                    <View
                      style={[
                        styles.viewerImageContainer,
                        { height: viewerHeight },
                      ]}
                    >
                      <Pressable
                        style={styles.viewerImagePressable}
                        onPress={() =>
                          setZoomImageUri(item.resultUri || item.originalUri)
                        }
                      >
                        <Image
                          source={{
                            uri: item.resultUri || item.originalUri,
                          }}
                          style={styles.viewerImage}
                        />
                        <View style={styles.zoomHint}>
                          <Feather
                            name="zoom-in"
                            size={14}
                            color={Colors.editing.text}
                          />
                          <ThemedText style={styles.zoomHintText}>
                            Tap to view
                          </ThemedText>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.viewerActionsRow}
              >
                <Pressable
                  style={[
                    styles.actionCard,
                    !selectedItem?.resultUri && styles.actionCardDisabled,
                  ]}
                  onPress={handleEditSelected}
                  disabled={!selectedItem?.resultUri}
                >
                  <LinearGradient
                    colors={actionCardGradients.edit}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCardGradient}
                  />
                  <View style={styles.actionIconContainer}>
                    <Feather name="edit-2" size={18} color={Colors.editing.text} />
                  </View>
                  <ThemedText style={styles.actionCardLabel}>Edit</ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionCard,
                    isWorking && styles.actionCardDisabled,
                  ]}
                  onPress={handleRetrySelected}
                  disabled={isWorking}
                >
                  <LinearGradient
                    colors={actionCardGradients.retry}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCardGradient}
                  />
                  <View style={styles.actionIconContainer}>
                    <Feather name="refresh-cw" size={18} color={Colors.editing.text} />
                  </View>
                  <ThemedText style={styles.actionCardLabel}>
                    {isRetrying ? "Retrying..." : "Retry"}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.actionCard,
                    (!selectedItem?.resultUri || isWorking) &&
                      styles.actionCardDisabled,
                  ]}
                  onPress={handleOpenIterate}
                  disabled={!selectedItem?.resultUri || isWorking}
                >
                  <LinearGradient
                    colors={actionCardGradients.iterate}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCardGradient}
                  />
                  <View style={styles.actionIconContainer}>
                    <Feather name="repeat" size={18} color={Colors.editing.text} />
                  </View>
                  <ThemedText style={styles.actionCardLabel}>Iterate</ThemedText>
                </Pressable>

                <Pressable style={styles.actionCard} onPress={handleNewSelected}>
                  <LinearGradient
                    colors={actionCardGradients.new}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCardGradient}
                  />
                  <View style={styles.actionIconContainer}>
                    <Feather name="plus" size={18} color={Colors.editing.text} />
                  </View>
                  <ThemedText style={styles.actionCardLabel}>New</ThemedText>
                </Pressable>
              </ScrollView>

              {isWorking && (
                <View style={styles.retryOverlay}>
                  <GlassCard theme="dark" variant="solid" padding="lg" borderRadius="xl">
                    <View style={styles.retryContent}>
                      <ProgressRing
                        progress={0.7}
                        size={72}
                        strokeWidth={6}
                        color={Colors.editing.primary}
                        backgroundColor="rgba(255, 255, 255, 0.1)"
                      >
                        <ActivityIndicator size="small" color={Colors.editing.primary} />
                      </ProgressRing>
                      <ThemedText style={styles.retryTitle}>{workingTitle}</ThemedText>
                    </View>
                  </GlassCard>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      <IterateSheet
        isOpen={isIterateOpen}
        value={iterateNotes}
        onChange={setIterateNotes}
        onClose={() => setIsIterateOpen(false)}
        onSubmit={handleIterateSelected}
        isSubmitting={isIterating}
      />

      <ZoomableImageModal
        visible={Boolean(zoomImageUri)}
        imageUri={zoomImageUri}
        onClose={() => setZoomImageUri(null)}
        title="Result preview"
      />
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
  },
  closeButton: {
    width: 44,
    alignItems: "flex-end",
  },
  grid: {
    flex: 1,
    paddingHorizontal: GRID_PADDING,
  },
  gridContent: {
    paddingTop: Spacing.md,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: GRID_GAP,
  },
  resultCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  resultImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  successBadge: {
    borderColor: Colors.editing.success,
    borderWidth: 1,
  },
  failedBadge: {
    borderColor: Colors.editing.error,
    borderWidth: 1,
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  failedText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tapBadge: {
    position: "absolute",
    left: Spacing.xs,
    bottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tapBadgeSuccess: {
    backgroundColor: "rgba(14, 165, 233, 0.45)",
    borderColor: "rgba(14, 165, 233, 0.6)",
    borderWidth: 1,
  },
  tapBadgeRetry: {
    backgroundColor: "rgba(249, 115, 22, 0.45)",
    borderColor: "rgba(249, 115, 22, 0.6)",
    borderWidth: 1,
  },
  tapBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    bottom: 0,
  },
  bottomContent: {
    gap: Spacing.sm,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  warningText: {
    color: Colors.editing.error,
    fontWeight: "600",
  },
  buttonRow: {
    gap: Spacing.sm,
  },
  viewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  viewerContent: {
    width: VIEWER_WIDTH,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.text,
  },
  viewerClose: {
    padding: 4,
  },
  swipeHint: {
    alignItems: "center",
  },
  swipePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  swipeHintText: {
    fontSize: 12,
    color: Colors.editing.textSecondary,
  },
  viewerCarousel: {
    alignItems: "center",
  },
  viewerSlide: {
    width: VIEWER_SLIDE_WIDTH,
    alignItems: "center",
  },
  viewerImageContainer: {
    width: VIEWER_SLIDE_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  viewerImagePressable: {
    width: "100%",
    height: "100%",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  zoomHint: {
    position: "absolute",
    right: Spacing.sm,
    bottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  zoomHintText: {
    fontSize: 11,
    color: Colors.editing.text,
  },
  viewerActionsRow: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  actionCard: {
    width: 92,
    height: 92,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionCardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
  },
  actionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.editing.text,
  },
  retryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  retryContent: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  retryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.editing.text,
  },
});
