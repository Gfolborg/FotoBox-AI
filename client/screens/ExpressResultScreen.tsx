import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system/legacy";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { IterateSheet } from "@/components/IterateSheet";
import { ZoomableImageModal } from "@/components/ZoomableImageModal";
import { CreditIndicator } from "@/components/CreditIndicator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  ExpressResultItem,
  getExpressGoalLabel,
  getExpressModelLabel,
} from "@/lib/express-presets";
import { getPlatformById } from "@/lib/platform-requirements";
import { runExpressTask } from "@/lib/express-generation";
import { getApiUrl } from "@/lib/query-client";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";
import { useNotification } from "@/context/NotificationContext";
import { useBatchEdit } from "@/context/BatchEditContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ExpressResult">;
type RouteProps = RouteProp<RootStackParamList, "ExpressResult">;
const VIEWER_WIDTH = Math.min(Dimensions.get("window").width - Spacing.lg * 4, 420);
const actionCardGradients = {
  edit: ["rgba(14, 165, 233, 0.28)", "rgba(59, 130, 246, 0.45)"],
  retry: ["rgba(249, 115, 22, 0.28)", "rgba(234, 88, 12, 0.45)"],
  iterate: ["rgba(20, 184, 166, 0.25)", "rgba(13, 148, 136, 0.45)"],
} as const;

async function appendSourceImage(
  formData: FormData,
  sourceUri: string,
  filename: string,
): Promise<void> {
  if (sourceUri.startsWith("data:")) {
    if (Platform.OS === "web") {
      const blob = await fetch(sourceUri).then((res) => res.blob());
      formData.append("file", blob, filename);
      return;
    }

    const mimeMatch = sourceUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mimeType = mimeMatch?.[1] || "image/jpeg";
    const extension = mimeType.includes("png")
      ? "png"
      : mimeType.includes("webp")
        ? "webp"
        : "jpg";
    const fileUri = `${FileSystem.documentDirectory}express_iterate_${Date.now()}.${extension}`;
    const base64Data = sourceUri.split(",", 2)[1];

    if (!base64Data) {
      throw new Error("Invalid image data");
    }

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
    return;
  }

  formData.append("file", {
    uri: sourceUri,
    name: filename,
    type: "image/jpeg",
  } as unknown as Blob);
}

async function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read generated image"));
    reader.readAsDataURL(blob);
  });
}

const buildIterationPrompt = (notes: string) =>
  `\n\nITERATION REQUEST:\n- Keep the product identity and design details exactly as-is.\n- Apply ONLY these changes: ${notes}\n- Keep framing realistic and product-focused.\n- Do not add text, borders, or padding.`;

export default function ExpressResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { token, subscription } = useAuth();
  const { requiresWatermark, consumeCredit } = useCredits();
  const { showNotification } = useNotification();
  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

  const {
    imageUri,
    productDescription,
    useCase,
    adStyle,
    platform,
    modelOption,
    customModelDirection,
  } = route.params;

  const [results, setResults] = useState<ExpressResultItem[]>(route.params.results);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isIterateOpen, setIsIterateOpen] = useState(false);
  const [iterateNotes, setIterateNotes] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const viewerScrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (!pendingEditResult) return;
      if (!pendingEditResult.originalUri.startsWith("express:")) return;

      const targetId = pendingEditResult.originalUri.replace("express:", "");
      setResults((prev) =>
        prev.map((item) =>
          item.id === targetId
            ? {
                ...item,
                resultUri: pendingEditResult.editedUri,
                status: "completed",
                error: undefined,
              }
            : item,
        ),
      );
      setPendingEditResult(null);
    }, [pendingEditResult, setPendingEditResult]),
  );

  useEffect(() => {
    if (viewerIndex === null) return;
    requestAnimationFrame(() => {
      viewerScrollRef.current?.scrollTo({
        x: viewerIndex * VIEWER_WIDTH,
        animated: false,
      });
    });
  }, [viewerIndex]);

  const groups = useMemo(
    () => ({
      background: results.filter((item) => item.kind === "background"),
      lifestyle: results.filter((item) => item.kind === "lifestyle"),
      mockup: results.filter((item) => item.kind === "mockup"),
    }),
    [results],
  );

  const selectedItem =
    viewerIndex !== null && viewerIndex >= 0 && viewerIndex < results.length
      ? results[viewerIndex]
      : null;

  const platformName = getPlatformById(platform)?.name || platform;
  const successCount = results.filter((item) => item.status === "completed").length;
  const failedItems = results.filter((item) => item.status === "failed");
  const planLabel =
    subscription?.plan === "unlimited"
      ? "Unlimited"
      : subscription?.plan === "pro"
        ? "Pro"
        : "Free";

  const showAuthPrompt = () => {
    Alert.alert(
      "Sign in required",
      "Please sign in to retry Express generations.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign in",
          onPress: () => {
            setAuthRedirect({
              name: "ExpressResult",
              params: {
                ...route.params,
                results,
              },
            });
            navigation.navigate("Auth");
          },
        },
      ],
    );
  };

  const retryOne = async (item: ExpressResultItem) => {
    if (!token) {
      showAuthPrompt();
      return;
    }

    setRetryingIds((prev) => new Set(prev).add(item.id));
    setResults((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "processing", error: undefined }
          : entry,
      ),
    );

    try {
      const resultUri = await runExpressTask({
        task: item,
        imageUri,
        token,
        platform,
        productDescription,
        modelOption,
        customModelDirection,
        requiresWatermark,
      });

      const creditResult = await consumeCredit(`express-${item.kind}`);
      if (!creditResult.success) {
        throw new Error(creditResult.error || "Insufficient credits to continue");
      }
      if (creditResult.creditsRemaining === 1) {
        showNotification("1 credit left! Grab more to keep going.", "warning");
      }

      setResults((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "completed",
                resultUri,
                error: undefined,
              }
            : entry,
        ),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Retry failed";

      if (/credit|upgrade|no credit/i.test(message)) {
        setShowUpgradePrompt(true);
      }

      setResults((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "failed",
                resultUri: null,
                error: message,
              }
            : entry,
        ),
      );
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const iterateOne = async (item: ExpressResultItem, notes: string): Promise<string> => {
    if (!token) {
      showAuthPrompt();
      throw new Error("Authentication required");
    }

    if (item.kind === "background") {
      throw new Error("Iterate is not available for background removal.");
    }

    const sourceUri = item.resultUri || imageUri;
    const trimmedNotes = notes.trim();

    if (item.kind === "lifestyle") {
      const formData = new FormData();
      await appendSourceImage(formData, sourceUri, "express_lifestyle_iterate.jpg");

      const url = new URL("/api/lifestyle-scene", getApiUrl());
      url.searchParams.set("environment", item.prompt);
      url.searchParams.set("isCustom", "true");
      url.searchParams.set("productDescription", productDescription);
      url.searchParams.set("shadowControl", "natural");
      url.searchParams.set("platform", platform);
      url.searchParams.set("iterationNotes", trimmedNotes);
      if (requiresWatermark) {
        url.searchParams.set("applyWatermark", "true");
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to iterate lifestyle image");
      }

      const blob = await response.blob();
      return blobToDataUri(blob);
    }

    const formData = new FormData();
    await appendSourceImage(formData, sourceUri, "express_mockup_iterate.jpg");
    formData.append("prompt", `${item.prompt}${buildIterationPrompt(trimmedNotes)}`);
    formData.append("mockupType", "express");
    formData.append("sceneVibe", item.sceneVibe || "professional");
    formData.append("cameraOption", item.cameraOption || "medium");
    formData.append("platform", platform);
    formData.append("modelOption", modelOption);
    if (customModelDirection?.trim()) {
      formData.append("modelDirection", customModelDirection.trim());
    }

    const mockupUrl = new URL("/api/mockup", getApiUrl());
    mockupUrl.searchParams.set("platform", platform);
    if (requiresWatermark) {
      mockupUrl.searchParams.set("applyWatermark", "true");
    }

    const mockupResponse = await fetch(mockupUrl.toString(), {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!mockupResponse.ok) {
      let message = "Failed to iterate mockup image";
      const rawText = await mockupResponse.text();
      try {
        const parsed = rawText ? JSON.parse(rawText) : {};
        message = parsed?.error || rawText || message;
      } catch {
        message = rawText || message;
      }
      throw new Error(message);
    }

    const data = await mockupResponse.json();
    if (!data?.resultUri) {
      throw new Error("Mockup API returned no image");
    }

    return data.resultUri as string;
  };

  const handleRetryFailed = async () => {
    if (!failedItems.length || isRetryingFailed) {
      return;
    }

    setIsRetryingFailed(true);
    for (const item of failedItems) {
      // eslint-disable-next-line no-await-in-loop
      await retryOne(item);
    }
    setIsRetryingFailed(false);
  };

  const handleEditSelected = async () => {
    if (!selectedItem?.resultUri) {
      return;
    }

    let editUri = selectedItem.resultUri;
    try {
      if (Platform.OS !== "web" && editUri.startsWith("data:")) {
        const filename = `express_edit_${Date.now()}.jpg`;
        const fileUri = FileSystem.documentDirectory + filename;
        const base64Data = editUri.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        editUri = fileUri;
      }

      setViewerIndex(null);
      navigation.navigate("EditImage", {
        imageUri: editUri,
        originalUri: `express:${selectedItem.id}`,
      });
    } catch (error) {
      console.error("[ExpressResult] Failed to prepare edit image", error);
      Alert.alert("Error", "Could not open image editor.");
    }
  };

  const handleIterateSubmit = async () => {
    const notes = iterateNotes.trim();
    if (!selectedItem || !notes || isIterating) {
      return;
    }

    if (selectedItem.kind === "background") {
      Alert.alert("Not available", "Iterate is available for lifestyle and mockup images.");
      return;
    }

    setIsIterating(true);
    setIsIterateOpen(false);

    try {
      const resultUri = await iterateOne(selectedItem, notes);
      const creditResult = await consumeCredit(`express-${selectedItem.kind}`);
      if (!creditResult.success) {
        throw new Error(creditResult.error || "Insufficient credits to continue");
      }
      if (creditResult.creditsRemaining === 1) {
        showNotification("1 credit left! Grab more to keep going.", "warning");
      }

      setResults((prev) =>
        prev.map((entry) =>
          entry.id === selectedItem.id
            ? {
                ...entry,
                status: "completed",
                resultUri,
                error: undefined,
              }
            : entry,
        ),
      );
      setIterateNotes("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Iteration failed";
      if (/credit|upgrade|no credit/i.test(message)) {
        setShowUpgradePrompt(true);
      }
      Alert.alert("Iteration failed", message);
    } finally {
      setIsIterating(false);
    }
  };

  const renderGroup = (title: string, subtitle: string, items: ExpressResultItem[]) => (
    <View style={styles.group}>
      <ThemedText style={styles.groupTitle}>{title}</ThemedText>
      <ThemedText style={styles.groupSubtitle}>{subtitle}</ThemedText>
      <View style={styles.grid}>
        {items.map((item) => {
          const isCompleted = item.status === "completed" && !!item.resultUri;
          const isProcessing = item.status === "processing";

          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const index = results.findIndex((entry) => entry.id === item.id);
                if (index >= 0) {
                  setViewerIndex(index);
                }
              }}
            >
              {isCompleted ? (
                <Image source={{ uri: item.resultUri! }} style={styles.cardImage} />
              ) : (
                <View style={styles.failedImage}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color={Colors.editing.primary} />
                  ) : (
                    <Feather name="image" size={24} color={Colors.light.textSecondary} />
                  )}
                  <ThemedText style={styles.failedText}>
                    {isProcessing ? "Processing" : "Failed"}
                  </ThemedText>
                </View>
              )}

              <View style={styles.cardBody}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.cardStatus} numberOfLines={2}>
                  {item.status === "completed"
                    ? "Completed"
                    : item.status === "processing"
                      ? "Retrying..."
                      : item.error || "Failed"}
                </ThemedText>
                <ThemedText style={styles.cardHint}>Tap for actions</ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const selectedItemRetrying =
    selectedItem ? retryingIds.has(selectedItem.id) : false;

  return (
    <GradientBackground theme="home">
      <ThemedHeader title="Express Results" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 54, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryAccountRow}>
            <CreditIndicator />
            <View style={styles.summaryPlanPill}>
              <ThemedText style={styles.summaryPlanPillText}>{planLabel} Plan</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.summaryTitle}>Bundle Complete</ThemedText>
          <ThemedText style={styles.summaryText}>
            {successCount} of 7 generated successfully
          </ThemedText>
          <View style={styles.metricsRow}>
            <View style={styles.metricChip}>
              <ThemedText style={styles.metricText}>
                Goal: {getExpressGoalLabel(useCase, adStyle)}
              </ThemedText>
            </View>
            <View style={styles.metricChip}>
              <ThemedText style={styles.metricText}>Platform: {platformName}</ThemedText>
            </View>
            <View style={styles.metricChip}>
              <ThemedText style={styles.metricText}>
                Model: {getExpressModelLabel(modelOption)}
                {customModelDirection ? " + custom" : ""}
              </ThemedText>
            </View>
            <View style={styles.metricChip}>
              <ThemedText style={styles.metricText}>Failed: {failedItems.length}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.summarySubtext}>
            Tap any image to open actions (Edit, Retry, Iterate).
          </ThemedText>
        </View>

        {renderGroup("Background Removal", "1 output", groups.background)}
        {renderGroup("Lifestyle Scenes", "3 outputs", groups.lifestyle)}
        {renderGroup("Mockup Images", "3 outputs", groups.mockup)}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}> 
        {failedItems.length > 0 && (
          <GradientButton
            title={isRetryingFailed ? "Retrying failed..." : `Retry Failed (${failedItems.length})`}
            icon="refresh-cw"
            onPress={handleRetryFailed}
            fullWidth
            disabled={isRetryingFailed}
            style={{ marginBottom: Spacing.sm }}
          />
        )}

        <GradientButton
          title="Done"
          icon="check"
          onPress={() => {
            const exportable = results
              .filter((item) => item.status === "completed" && item.resultUri)
              .map((item) => ({
                originalUri: imageUri,
                resultUri: item.resultUri as string,
              }));

            if (!exportable.length) {
              Alert.alert(
                "No completed images",
                "Finish at least one generation before continuing.",
              );
              return;
            }

            navigation.navigate("BatchPlatformSelection", {
              results: exportable,
              sourceService: "express",
            });
          }}
          fullWidth
        />
      </View>

      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerIndex(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setViewerIndex(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{selectedItem?.title || "Actions"}</ThemedText>
              <Pressable onPress={() => setViewerIndex(null)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color={Colors.light.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              ref={viewerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(
                  event.nativeEvent.contentOffset.x / VIEWER_WIDTH,
                );
                if (nextIndex !== viewerIndex) {
                  setViewerIndex(nextIndex);
                }
              }}
            >
              {results.map((item) => (
                <View key={item.id} style={[styles.modalSlide, { width: VIEWER_WIDTH }]}>
                  {item.resultUri ? (
                    <Pressable
                      style={styles.modalImagePress}
                      onPress={() => setIsZoomOpen(true)}
                    >
                      <Image source={{ uri: item.resultUri }} style={styles.modalImage} />
                      <View style={styles.modalTapHint}>
                        <Feather name="zoom-in" size={12} color={Colors.editing.text} />
                        <ThemedText style={styles.modalTapHintText}>Tap to view</ThemedText>
                      </View>
                    </Pressable>
                  ) : (
                    <View style={styles.modalFailedImage}>
                      <Feather name="image" size={24} color={Colors.light.textSecondary} />
                      <ThemedText style={styles.failedText}>No generated image yet</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalPagerRow}>
              <ThemedText style={styles.modalPagerText}>
                {viewerIndex !== null ? viewerIndex + 1 : 1} / {results.length}
              </ThemedText>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalActionsRow}
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
                  (selectedItemRetrying || isRetryingFailed) &&
                    styles.actionCardDisabled,
                ]}
                onPress={() => selectedItem && retryOne(selectedItem)}
                disabled={selectedItemRetrying || isRetryingFailed}
              >
                <LinearGradient
                  colors={actionCardGradients.retry}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  {selectedItemRetrying ? (
                    <ActivityIndicator size="small" color={Colors.editing.text} />
                  ) : (
                    <Feather name="refresh-cw" size={18} color={Colors.editing.text} />
                  )}
                </View>
                <ThemedText style={styles.actionCardLabel}>
                  {selectedItemRetrying ? "Retrying..." : "Retry"}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.actionCard,
                  (!selectedItem?.resultUri ||
                    selectedItem?.kind === "background" ||
                    isIterating) &&
                    styles.actionCardDisabled,
                ]}
                onPress={() => {
                  if (selectedItem?.kind === "background") {
                    Alert.alert(
                      "Not available",
                      "Iterate is available for lifestyle and mockup images.",
                    );
                    return;
                  }
                  setIsIterateOpen(true);
                }}
                disabled={
                  !selectedItem?.resultUri ||
                  selectedItem?.kind === "background" ||
                  isIterating
                }
              >
                <LinearGradient
                  colors={actionCardGradients.iterate}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  {isIterating ? (
                    <ActivityIndicator size="small" color={Colors.editing.text} />
                  ) : (
                    <Feather name="repeat" size={18} color={Colors.editing.text} />
                  )}
                </View>
                <ThemedText style={styles.actionCardLabel}>
                  {isIterating ? "Iterating..." : "Iterate"}
                </ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <IterateSheet
        isOpen={isIterateOpen}
        value={iterateNotes}
        onChange={setIterateNotes}
        onClose={() => setIsIterateOpen(false)}
        onSubmit={handleIterateSubmit}
        isSubmitting={isIterating}
      />

      <ZoomableImageModal
        visible={isZoomOpen}
        imageUri={selectedItem?.resultUri || ""}
        onClose={() => setIsZoomOpen(false)}
        title={selectedItem?.title || "Result preview"}
      />

      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.75)",
    padding: Spacing.md,
  },
  summaryAccountRow: {
    marginBottom: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  summaryPlanPill: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.74)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  summaryPlanPillText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "700",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  summaryText: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: "600",
  },
  summarySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  metricsRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  metricChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  metricText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  group: {
    gap: Spacing.sm,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  groupSubtitle: {
    marginTop: -Spacing.xs,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  card: {
    width: "48%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.75)",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  failedImage: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
    gap: 4,
  },
  failedText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  cardBody: {
    padding: Spacing.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.text,
  },
  cardStatus: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.light.textSecondary,
    minHeight: 30,
  },
  cardHint: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.editing.primary,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: BorderRadius.lg,
    resizeMode: "cover",
  },
  modalSlide: {
    alignItems: "center",
  },
  modalImagePress: {
    width: "100%",
  },
  modalTapHint: {
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
  modalTapHintText: {
    fontSize: 11,
    color: Colors.editing.text,
  },
  modalFailedImage: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
    gap: 4,
  },
  modalPagerRow: {
    alignItems: "center",
  },
  modalPagerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  modalActionsRow: {
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
});
