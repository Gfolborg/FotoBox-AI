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
import {
  useRoute,
  useNavigation,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
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
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useBatchEdit } from "@/context/BatchEditContext";
import { getApiUrl } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";
import { ProgressRing } from "@/components/ProgressRing";
import { IterateSheet } from "@/components/IterateSheet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = Spacing.lg;
const GRID_GAP = Spacing.sm;
const NUM_COLUMNS = 2;
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / NUM_COLUMNS;
const VIEWER_WIDTH = Math.min(SCREEN_WIDTH - Spacing.lg * 2, 420);
const VIEWER_SLIDE_WIDTH = VIEWER_WIDTH - Spacing.lg * 2;
const VIEWER_MAX_HEIGHT = Dimensions.get("window").height * 0.55;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "BatchMockupResult">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getExtensionFromDataUri = (dataUri: string): string => {
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
  if (!match) return "jpg";
  const raw = match[1].toLowerCase();
  if (raw === "jpeg") return "jpg";
  if (raw === "png") return "png";
  if (raw === "webp") return "webp";
  return "jpg";
};

export default function BatchMockupResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const viewerScrollRef = React.useRef<ScrollView>(null);
  const {
    results: initialResults,
    sceneVibe,
    cameraOption,
    modelOption,
    customScenePrompt,
    negativePrompt,
    customDescription,
    mockupItem,
    mockupColor,
  } = route.params;

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
  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

  useFocusEffect(
    useCallback(() => {
      if (pendingEditResult) {
        setResults((prev) =>
          prev.map((item) =>
            item.originalUri === pendingEditResult.originalUri
              ? { ...item, resultUri: pendingEditResult.editedUri }
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

    navigation.navigate("BatchPlatformSelection", {
      results: exportableResults,
      sourceService: "mockup",
    });
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.popToTop();
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
      const prompt = getMockupPrompt(
        mockupItem,
        sceneVibe,
        cameraOption,
        mockupColor,
        customDescription,
        modelOption,
        customScenePrompt,
        negativePrompt,
      );

      const manipulated = await ImageManipulator.manipulateAsync(
        selectedItem.originalUri,
        [],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      const formData = new FormData();
      formData.append("file", {
        uri: manipulated.uri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
      formData.append("prompt", prompt);
      if (customScenePrompt) {
        formData.append("customPrompt", customScenePrompt);
      }
      if (negativePrompt) {
        formData.append("negativePrompt", negativePrompt);
      }
      formData.append("mockupType", mockupItem.id);
      formData.append("sceneVibe", sceneVibe.id);
      formData.append("cameraOption", cameraOption.id);
      if (mockupColor) {
        formData.append("mockupColor", mockupColor);
      }

      const response = await fetch(
        new URL("/api/mockup", getApiUrl()).toString(),
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mockup");
      }

      const data = await response.json();

      setResults((prev) =>
        prev.map((item, idx) =>
          idx === targetIndex
            ? { ...item, resultUri: data.resultUri, status: "completed" }
            : item,
        ),
      );
    } catch (error) {
      console.error("Batch retry failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web") {
        Alert.alert("Generation Failed", message);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const buildIterationPrompt = (notes: string) =>
    `\n\nITERATION REQUEST:\n- Refine the provided mockup image. Keep the product identical and preserve the overall scene.\n- Apply ONLY these changes: ${notes}\n- Do not add text, borders, or padding.`;

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
      const prompt = `${getMockupPrompt(
        mockupItem,
        sceneVibe,
        cameraOption,
        mockupColor,
        customDescription,
        modelOption,
        customScenePrompt,
        negativePrompt,
      )}${buildIterationPrompt(notes)}`;

      const formData = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetch(selectedItem.resultUri).then((res) => res.blob());
        formData.append("file", blob, "mockup-iterate.png");
      } else {
        let sourceUri = selectedItem.resultUri;
        if (sourceUri.startsWith("data:")) {
          const extension = getExtensionFromDataUri(sourceUri);
          const filename = `iterate_source_${Date.now()}.${extension}`;
          const fileUri = FileSystem.documentDirectory + filename;
          const base64Data = sourceUri.split(",")[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          sourceUri = fileUri;
        }

        const manipulated = await ImageManipulator.manipulateAsync(
          sourceUri,
          [],
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
        );

        formData.append("file", {
          uri: manipulated.uri,
          name: "product_photo.jpg",
          type: "image/jpeg",
        } as unknown as Blob);
      }

      formData.append("prompt", prompt);
      if (customScenePrompt) {
        formData.append("customPrompt", customScenePrompt);
      }
      if (negativePrompt) {
        formData.append("negativePrompt", negativePrompt);
      }
      formData.append("mockupType", mockupItem.id);
      formData.append("sceneVibe", sceneVibe.id);
      formData.append("cameraOption", cameraOption.id);
      if (mockupColor) {
        formData.append("mockupColor", mockupColor);
      }

      const response = await fetch(
        new URL("/api/mockup", getApiUrl()).toString(),
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mockup");
      }

      const data = await response.json();

      setResults((prev) =>
        prev.map((item, idx) =>
          idx === targetIndex
            ? { ...item, resultUri: data.resultUri, status: "completed" }
            : item,
        ),
      );
      setIterateNotes("");
    } catch (error) {
      console.error("Iteration failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web") {
        Alert.alert("Iteration Failed", message);
      }
    } finally {
      setIsIterating(false);
    }
  };

  const handleEditSelected = async () => {
    if (!selectedItem?.resultUri) return;
    setViewerIndex(null);

    try {
      let imageUri = selectedItem.resultUri;
      if (Platform.OS !== "web" && imageUri.startsWith("data:")) {
        const extension = getExtensionFromDataUri(imageUri);
        const filename = `edit_temp_${Date.now()}.${extension}`;
        const fileUri = FileSystem.documentDirectory + filename;
        const base64Data = imageUri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageUri = fileUri;
      }

      navigation.navigate("EditImage", {
        imageUri,
        originalUri: selectedItem.originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  const handleNewSelected = () => {
    if (!selectedItem) return;
    setViewerIndex(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Start a new mockup",
      "Use the same product image or choose a new one.",
      [
        {
          text: "Use same image",
          onPress: () =>
            navigation.navigate("MockupWizardImages", {
              imageUri: selectedItem.originalUri,
            }),
        },
        {
          text: "Choose new image",
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
                quality: 1,
              });
              if (!result.canceled && result.assets[0]) {
                navigation.navigate("MockupWizardImages", {
                  imageUri: result.assets[0].uri,
                });
              }
            } catch (error) {
              console.error("Failed to pick image:", error);
              if (Platform.OS !== "web") {
                Alert.alert("Error", "Could not access your photos.");
              }
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const isWorking = isRetrying || isIterating;
  const workingTitle = isIterating ? "Iterating" : "Regenerating";

  const renderResultItem = ({
    item,
    index,
  }: {
    item: (typeof results)[0];
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
            color={Colors.editing.text}
          />
          <ThemedText style={styles.tapBadgeText}>
            {isSuccess ? "Tap to edit" : "Tap to retry"}
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
              <ThemedText style={styles.headerTitle}>Mockup Results</ThemedText>
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
          <Animated.View
            entering={FadeIn.duration(200)}
            style={styles.viewerOverlay}
          >
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
                      <Image
                        source={{
                          uri: item.resultUri || item.originalUri,
                        }}
                        style={styles.viewerImage}
                      />
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
                      <ThemedText style={styles.retryTitle}>
                        {workingTitle}
                      </ThemedText>
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
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flex: 1,
  },
  gridContent: {
    padding: GRID_PADDING,
  },
  gridRow: {
    gap: GRID_GAP,
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
  tapBadge: {
    position: "absolute",
    left: Spacing.xs,
    bottom: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tapBadgeSuccess: {
    backgroundColor: "rgba(14, 165, 233, 0.8)",
  },
  tapBadgeRetry: {
    backgroundColor: "rgba(249, 115, 22, 0.8)",
  },
  tapBadgeText: {
    color: Colors.editing.text,
    fontSize: 10,
    fontWeight: "600",
  },
  viewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  viewerContent: {
    width: VIEWER_WIDTH,
    backgroundColor: Colors.editing.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  swipePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.18)",
  },
  swipeHintText: {
    color: Colors.editing.text,
    fontSize: 13,
    fontWeight: "600",
  },
  viewerTitle: {
    color: Colors.editing.text,
    fontSize: 14,
    fontWeight: "600",
  },
  viewerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  viewerImageContainer: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  viewerCarousel: {
    alignItems: "center",
  },
  viewerSlide: {
    width: VIEWER_SLIDE_WIDTH,
    gap: Spacing.md,
  },
  viewerImage: {
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
    justifyContent: "center",
    alignItems: "center",
  },
  successBadge: {
    backgroundColor: Colors.editing.success,
  },
  failedBadge: {
    backgroundColor: Colors.editing.error,
  },
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  failedText: {
    color: Colors.editing.error,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bottomContent: {
    gap: Spacing.md,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  warningText: {
    color: Colors.editing.error,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionCard: {
    width: 96,
    height: 96,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
    alignItems: "center",
    gap: Spacing.xs,
    overflow: "hidden",
  },
  actionCardDisabled: {
    opacity: 0.6,
  },
  actionCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  actionCardLabel: {
    color: Colors.editing.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  viewerActionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  retryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  retryContent: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  retryTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
