import * as React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Dimensions,
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
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassPill } from "@/components/GlassPill";
import { IconButton } from "@/components/IconButton";
import { ApplyToAllModal } from "@/components/ApplyToAllModal";
import { GradientBackground } from "@/components/GradientBackground";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { saveToFotoBoxAlbum } from "@/lib/save-to-album";
import { useBatchEdit } from "@/context/BatchEditContext";
import { getApiUrl } from "@/lib/query-client";
import { useNotification } from "@/context/NotificationContext";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchResult"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchResult">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

export default function BatchResultScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { results, backgroundColor = "#FFFFFF" } = route.params;
  const { showNotification } = useNotification();

  const [savedUris, setSavedUris] = React.useState<Set<string>>(new Set());
  const [savingUris, setSavingUris] = React.useState<Set<string>>(new Set());
  const [deletedUris, setDeletedUris] = React.useState<Set<string>>(new Set());
  const [retryingUris, setRetryingUris] = React.useState<Set<string>>(
    new Set(),
  );
  const [retryErrorUris, setRetryErrorUris] = React.useState<Set<string>>(
    new Set(),
  );
  const retryErrorTimers = React.useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());
  const [showApplyAllModal, setShowApplyAllModal] = React.useState(false);
  const [editedImages, setEditedImages] = React.useState<Set<string>>(
    new Set(),
  );
  const [lastEditedUri, setLastEditedUri] = React.useState<string | null>(null);

  const {
    hasShownApplyAllPopup,
    setHasShownApplyAllPopup,
    savedEditSettings,
    setSavedEditSettings,
    pendingEditResult,
    setPendingEditResult,
  } = useBatchEdit();

  // State to track updated results (with edited images)
  const [updatedResults, setUpdatedResults] = React.useState(results);

  // Filter out deleted results
  const visibleResults = updatedResults.filter((r) => !deletedUris.has(r.originalUri));
  const successfulResults = visibleResults.filter((r) => r.resultUri !== null);
  const failedCount = visibleResults.filter((r) => r.resultUri === null).length;
  const uneditedCount = successfulResults.length - editedImages.size;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  React.useEffect(() => {
    return () => {
      retryErrorTimers.current.forEach((timer) => clearTimeout(timer));
      retryErrorTimers.current.clear();
    };
  }, []);

  // Process pending edit result when screen regains focus
  useFocusEffect(
    React.useCallback(() => {
      if (pendingEditResult) {
        // Update the results with the edited image
        setUpdatedResults((prev) =>
          prev.map((item) =>
            item.originalUri === pendingEditResult.originalUri
              ? { ...item, resultUri: pendingEditResult.editedUri }
              : item
          )
        );
        setEditedImages((prev) => new Set([...prev, pendingEditResult.originalUri]));
        setLastEditedUri(pendingEditResult.originalUri);
        
        // Clear the pending result
        setPendingEditResult(null);

        // Show apply to all modal if applicable
        if (!hasShownApplyAllPopup && successfulResults.length > 1 && uneditedCount > 0) {
          setShowApplyAllModal(true);
          setHasShownApplyAllPopup(true);
        }
      }
    }, [pendingEditResult, hasShownApplyAllPopup, uneditedCount, successfulResults.length]),
  );

  const handleSaveImage = async (resultUri: string, originalUri: string) => {
    setSavingUris((prev) => new Set([...prev, originalUri]));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await saveToFotoBoxAlbum(resultUri, "product_image");

    if (result.success) {
      setSavedUris((prev) => new Set([...prev, originalUri]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      if (Platform.OS !== "web") {
        Alert.alert("Error", result.error || "Failed to save image");
      }
    }

    setSavingUris((prev) => {
      const newSet = new Set(prev);
      newSet.delete(originalUri);
      return newSet;
    });
  };

  const handleGenerateMore = () => {
    navigation.popToTop();
  };

  const handleEditImage = async (resultUri: string, originalUri: string) => {
    try {
      // On web, pass the data URI directly
      if (Platform.OS === "web") {
        setLastEditedUri(originalUri);
        navigation.navigate("EditImage", {
          imageUri: resultUri,
          originalUri: originalUri,
        });
        return;
      }

      const filename = `edit_temp_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;

      const base64Data = resultUri.split(",")[1];
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setLastEditedUri(originalUri);
      navigation.navigate("EditImage", {
        imageUri: fileUri,
        originalUri: originalUri,
      });
    } catch (error) {
      console.error("Failed to prepare image for editing:", error);
      if (Platform.OS !== "web") {
        Alert.alert("Error", "Could not prepare image for editing.");
      }
    }
  };

  const handleRetryImage = async (originalUri: string) => {
    if (retryingUris.has(originalUri)) {
      return;
    }

    setRetryingUris((prev) => new Set([...prev, originalUri]));
    setRetryErrorUris((prev) => {
      const newSet = new Set(prev);
      newSet.delete(originalUri);
      return newSet;
    });
    setUpdatedResults((prev) =>
      prev.map((item) =>
        item.originalUri === originalUri
          ? { ...item, status: "processing", error: undefined }
          : item,
      ),
    );

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: originalUri,
        name: "product_photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(backgroundColor);
      const endpoint = `${apiUrl}api/main-image?backgroundColor=${bgColorParam}`;

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
        throw new Error(errorText || "Failed to regenerate image");
      }

      const blob = await response.blob();
      const reader = new FileReader();

      const resultUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setUpdatedResults((prev) =>
        prev.map((item) =>
          item.originalUri === originalUri
            ? {
                ...item,
                resultUri,
                status: "completed",
                error: undefined,
              }
            : item,
        ),
      );
      setRetryErrorUris((prev) => {
        const newSet = new Set(prev);
        newSet.delete(originalUri);
        return newSet;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      showNotification("Retry failed. Please try again.", "error");
      setRetryErrorUris((prev) => new Set([...prev, originalUri]));
      const existingTimer = retryErrorTimers.current.get(originalUri);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        setRetryErrorUris((prev) => {
          const newSet = new Set(prev);
          newSet.delete(originalUri);
          return newSet;
        });
        retryErrorTimers.current.delete(originalUri);
      }, 3500);
      retryErrorTimers.current.set(originalUri, timer);
      setUpdatedResults((prev) =>
        prev.map((item) =>
          item.originalUri === originalUri
            ? {
                ...item,
                status: "failed",
                error: errorMessage,
              }
            : item,
        ),
      );
    } finally {
      setRetryingUris((prev) => {
        const newSet = new Set(prev);
        newSet.delete(originalUri);
        return newSet;
      });
    }
  };

  const handleApplyToAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    successfulResults.forEach((item) => {
      if (!editedImages.has(item.originalUri)) {
        setEditedImages((prev) => new Set([...prev, item.originalUri]));
      }
    });
  };

  const handleSkipApplyAll = () => {};

  const handleDeleteImage = (originalUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS !== "web") {
      Alert.alert(
        "Delete Image",
        "Are you sure you want to remove this image from results?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setDeletedUris((prev) => new Set([...prev, originalUri]));
              // Also remove from saved/edited states
              setSavedUris((prev) => {
                const newSet = new Set(prev);
                newSet.delete(originalUri);
                return newSet;
              });
              setEditedImages((prev) => {
                const newSet = new Set(prev);
                newSet.delete(originalUri);
                return newSet;
              });
            },
          },
        ],
      );
    } else {
      // On web, delete directly without confirmation
      setDeletedUris((prev) => new Set([...prev, originalUri]));
    }
  };

  const handleExportAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Prepare results for batch platform selection
    const exportableResults = successfulResults
      .filter((r) => r.resultUri)
      .map((r) => ({
        originalUri: r.originalUri,
        resultUri: r.resultUri!,
      }));

    navigation.navigate("BatchPlatformSelection", {
      results: exportableResults,
    });
  };

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="chevron-left"
              onPress={() => navigation.popToTop()}
              size={44}
              iconSize={24}
              variant="ghost"
              color={Colors.editing.text}
            />

            <GlassPill>
              <Feather
                name="check-circle"
                size={16}
                color={Colors.editing.success}
              />
              <ThemedText style={styles.headerTitle}>Results</ThemedText>
            </GlassPill>

            <View style={{ width: 44 }} />
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.statsRow}
        >
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {successfulResults.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Successful</ThemedText>
          </View>
          {failedCount > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, styles.errorNumber]}>
                  {failedCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Failed</ThemedText>
              </View>
            </>
          )}
        </Animated.View>

        {/* Image Grid */}
        <FlatList
          data={visibleResults}
          numColumns={2}
          keyExtractor={(item) => item.originalUri}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(200 + index * 60).duration(400)}
              style={styles.resultCard}
            >
              {(() => {
                const isRetrying = retryingUris.has(item.originalUri);
                return item.resultUri ? (
                  <>
                    <Pressable
                      style={styles.imageContainer}
                      onPress={() =>
                        handleEditImage(item.resultUri!, item.originalUri)
                      }
                    >
                      <Image
                        source={{ uri: item.resultUri }}
                        style={styles.image}
                      />
                    </Pressable>
                    {isRetrying && (
                      <View style={styles.retryOverlay}>
                        <ActivityIndicator
                          size="small"
                          color={Colors.editing.text}
                        />
                      </View>
                    )}

                    {/* Delete Button */}
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteImage(item.originalUri)}
                    >
                      <Feather name="trash-2" size={14} color="#FFFFFF" />
                    </Pressable>

                    {/* Status Badge */}
                    {savedUris.has(item.originalUri) &&
                      item.status !== "failed" && (
                      <View style={styles.savedBadge}>
                        <Feather
                          name="check"
                          size={12}
                          color={Colors.editing.buttonText}
                        />
                      </View>
                    )}
                    {/* Warning badge when background wasn't verified */}
                    {item.backgroundVerified === false && !savedUris.has(item.originalUri) && (
                      <View style={styles.warningBadge}>
                        <Feather name="alert-triangle" size={12} color="#FFFFFF" />
                      </View>
                    )}
                    {retryErrorUris.has(item.originalUri) && (
                      <View style={styles.errorPill}>
                        <ThemedText style={styles.errorPillText}>
                          Retry failed
                        </ThemedText>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() =>
                          handleEditImage(item.resultUri!, item.originalUri)
                        }
                      >
                        <ThemedText style={styles.buttonText}>Edit</ThemedText>
                      </Pressable>
                      <Pressable
                        style={styles.retryButton}
                        onPress={() => handleRetryImage(item.originalUri)}
                        disabled={isRetrying}
                      >
                        <Feather
                          name={isRetrying ? "loader" : "refresh-cw"}
                          size={14}
                          color="#FFFFFF"
                        />
                        <ThemedText style={styles.buttonText}>
                          {isRetrying ? "Retrying" : "Retry"}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.saveButton,
                          savedUris.has(item.originalUri) &&
                            styles.saveButtonSaved,
                        ]}
                        onPress={() =>
                          handleSaveImage(item.resultUri!, item.originalUri)
                        }
                        disabled={
                          savingUris.has(item.originalUri) ||
                          savedUris.has(item.originalUri)
                        }
                      >
                        <ThemedText
                          style={[
                            styles.buttonText,
                            savedUris.has(item.originalUri) &&
                              styles.buttonTextSaved,
                          ]}
                        >
                          {savingUris.has(item.originalUri)
                            ? "Saving..."
                            : savedUris.has(item.originalUri)
                              ? "Saved"
                              : "Save"}
                        </ThemedText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <View style={styles.failedCard}>
                    <Feather
                      name="alert-circle"
                      size={28}
                      color={Colors.editing.error}
                    />
                    <ThemedText style={styles.errorText} numberOfLines={2}>
                      {item.error || "Failed"}
                    </ThemedText>
                    <Pressable
                      style={[styles.retryButton, styles.retryButtonFailed]}
                      onPress={() => handleRetryImage(item.originalUri)}
                      disabled={isRetrying}
                    >
                      <Feather
                        name={isRetrying ? "loader" : "refresh-cw"}
                        size={14}
                        color="#FFFFFF"
                      />
                      <ThemedText style={styles.buttonText}>
                        {isRetrying ? "Retrying" : "Retry"}
                      </ThemedText>
                    </Pressable>
                  </View>
                );
              })()}
            </Animated.View>
          )}
        />

        {/* Bottom Action Bar */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + Spacing.md },
          ]}
        >
          <View style={styles.bottomContent}>
            {successfulResults.length > 0 ? (
              <>
                <GradientButton
                  title={`Save All (${successfulResults.length})`}
                  onPress={handleExportAll}
                  icon="download"
                  style={styles.actionButton}
                />
                <GradientButton
                  title="New"
                  onPress={handleGenerateMore}
                  variant="secondary"
                  icon="plus"
                  style={styles.actionButton}
                />
              </>
            ) : (
              <GradientButton
                title="Start New"
                onPress={handleGenerateMore}
                icon="plus"
                style={styles.singleActionButton}
              />
            )}
          </View>
        </Animated.View>

        {/* Apply to All Modal */}
        <ApplyToAllModal
          visible={showApplyAllModal}
          remainingCount={uneditedCount}
          onApplyToAll={handleApplyToAll}
          onSkip={handleSkipApplyAll}
          onClose={() => setShowApplyAllModal(false)}
        />
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
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: Colors.editing.success,
    fontSize: 32,
    fontWeight: "700",
  },
  errorNumber: {
    color: Colors.editing.error,
  },
  statLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.editing.border,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 200,
  },
  gridRow: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultCard: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  retryOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  savedBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.editing.success,
    justifyContent: "center",
    alignItems: "center",
  },
  warningBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  errorPill: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  actionButtons: {
    position: "absolute",
    bottom: Spacing.xs,
    left: Spacing.xs,
    right: Spacing.xs,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  editButton: {
    paddingHorizontal: Spacing.sm,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.sm,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  retryButtonFailed: {
    marginTop: Spacing.sm,
  },
  saveButton: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonSaved: {
    backgroundColor: Colors.editing.success,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonTextSaved: {
    color: "#FFFFFF",
  },
  failedCard: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.editing.error,
    fontSize: 12,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  bottomContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  actionButton: {
    flex: 1,
  },
  singleActionButton: {
    minWidth: 200,
  },
});
