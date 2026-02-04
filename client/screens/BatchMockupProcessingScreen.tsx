import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Image, FlatList, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import {
  ProcessingTips,
  DEFAULT_PROCESSING_TIPS,
} from "@/components/ProcessingTips";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";

type BatchMockupProcessingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchMockupProcessing"
>;

type BatchMockupProcessingScreenRouteProp = RouteProp<
  RootStackParamList,
  "BatchMockupProcessing"
>;

interface ProcessingResult {
  originalUri: string;
  resultUri: string | null;
  error?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export default function BatchMockupProcessingScreen() {
  const navigation = useNavigation<BatchMockupProcessingScreenNavigationProp>();
  const route = useRoute<BatchMockupProcessingScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { requiresWatermark, consumeCredit } = useCredits();
  const { token } = useAuth();

  const {
    imageUris,
    mockupItem,
    sceneVibe,
    cameraOption,
    mockupColor,
    customDescription,
    modelOption,
    customScenePrompt,
    negativePrompt,
    useCase,
    adStyle,
    productCategoryId,
    desiredMockup,
    templatePrompt,
    productMaterial,
    productSize,
    hasDesign,
    sceneType,
    sceneSetting,
  } = route.params;

  const [results, setResults] = useState<ProcessingResult[]>(
    imageUris.map((uri) => ({
      originalUri: uri,
      resultUri: null,
      status: "pending",
    })),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusText, setStatusText] = useState("Creating mockups...");
  const [detailText, setDetailText] = useState(
    `${mockupItem.label} • ${sceneVibe.label}`,
  );
  const [showRetry, setShowRetry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasStartedRef = useRef(false);
  const abortControllersRef = useRef<AbortController[]>([]);
  const isCancelledRef = useRef(false);
  const resultsRef = useRef<ProcessingResult[]>(results);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const showAuthPrompt = () => {
    Alert.alert(
      "Sign in required",
      "Please sign in to generate mockups.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign in",
          onPress: () => {
            setAuthRedirect({ name: "BatchMockupProcessing", params: route.params });
            navigation.navigate("Auth");
          },
        },
      ],
    );
  };

  const completedCount = results.filter((r) => r.status === "completed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const totalCount = imageUris.length;
  const progress = ((completedCount + failedCount) / totalCount) * 100;

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    processAllImages();
  }, []);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current = [];
    };
  }, []);

  const processAllImages = async (resume: boolean = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowRetry(false);
    setStatusText(resume ? "Resuming mockups..." : "Creating mockups...");

    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 2000;
    const MAX_DELAY_MS = 15000;
    const BETWEEN_REQUEST_DELAY_MS = 600;
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const isRateLimitError = (statusCode: number | null, data: unknown) => {
      if (statusCode === 429) return true;
      if (!data || typeof data !== "object") return false;
      const maybeError = (data as { error?: { code?: number; status?: string } }).error;
      return maybeError?.code === 429 || maybeError?.status === "RESOURCE_EXHAUSTED";
    };

    const prompt = getMockupPrompt(
      mockupItem,
      sceneVibe,
      cameraOption,
      mockupColor,
      customDescription,
      modelOption,
      customScenePrompt,
      negativePrompt,
      useCase,
      adStyle,
      productCategoryId,
      desiredMockup,
      templatePrompt,
      undefined,
      productMaterial,
      productSize,
      hasDesign,
      sceneType,
      sceneSetting,
    );

    let workingResults: ProcessingResult[] =
      resume && resultsRef.current.length === imageUris.length
        ? [...resultsRef.current]
        : imageUris.map((uri) => ({
            originalUri: uri,
            resultUri: null,
            status: "pending",
          }));

    if (!resume) {
      setResults(workingResults);
    }

    for (let i = 0; i < imageUris.length; i++) {
      if (isCancelledRef.current) return;
      if (workingResults[i]?.status === "completed") {
        continue;
      }
      setCurrentIndex(i);
      workingResults = workingResults.map((r, idx) =>
        idx === i ? { ...r, status: "processing" } : r,
      );
      setResults(workingResults);

      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUris[i],
          [],
          { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
        );
        const formData = new FormData();
        formData.append("file", {
          uri: manipulated.uri,
          name: `product_${i}.jpg`,
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

        const controller = new AbortController();
        abortControllersRef.current.push(controller);
        const mockupUrl = new URL("/api/mockup", getApiUrl());
        if (requiresWatermark) {
          mockupUrl.searchParams.set("applyWatermark", "true");
        }
        if (!token) {
          throw new Error("Authentication required");
        }
        const fetchWithRetry = async () => {
          for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
            if (isCancelledRef.current) return null;
            const response = await fetch(mockupUrl.toString(), {
              method: "POST",
              body: formData,
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            });

            if (response.ok) {
              return response;
            }

            let errorPayload: unknown = null;
            const rawText = await response.text();
            try {
              errorPayload = rawText ? JSON.parse(rawText) : null;
            } catch {
              errorPayload = rawText ? { error: { message: rawText } } : null;
            }

            if (isRateLimitError(response.status, errorPayload)) {
              if (attempt <= MAX_RETRIES) {
                const delay = Math.min(
                  BASE_DELAY_MS * Math.pow(2, attempt - 1),
                  MAX_DELAY_MS,
                );
                setStatusText(
                  `Rate limit hit. Retrying image ${i + 1} of ${imageUris.length} in ${Math.ceil(delay / 1000)}s (attempt ${attempt}/${MAX_RETRIES})...`,
                );
                await sleep(delay);
                continue;
              }
              throw new Error("Rate limit reached. Please try again in a minute.");
            }

            const message =
              (errorPayload as { error?: string | { message?: string } })?.error;
            const errorMessage =
              typeof message === "string" ? message : message?.message;
            throw new Error(errorMessage || "Failed to create mockup");
          }
          return null;
        };

        const response = await fetchWithRetry();
        if (!response) {
          setIsProcessing(false);
          return;
        }

        setStatusText("Creating mockups...");
        const data = await response.json();
        
        // Consume a credit for successful generation
        await consumeCredit("mockup");

        workingResults = workingResults.map((r, idx) =>
          idx === i
            ? { ...r, resultUri: data.resultUri, status: "completed" }
            : r,
        );
        setResults(workingResults);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        if (isCancelledRef.current) return;
        if (error instanceof Error && error.message === "Authentication required") {
          showAuthPrompt();
          workingResults = workingResults.map((r, idx) =>
            idx === i
              ? { ...r, error: "Authentication required", status: "failed" }
              : r,
          );
          setResults(workingResults);
          setIsProcessing(false);
          return;
        }
        console.error(`Mockup processing error for image ${i}:`, error);
        if (error instanceof Error && error.message.includes("Rate limit")) {
          setStatusText(error.message);
          setShowRetry(true);
          setIsProcessing(false);
        }
        workingResults = workingResults.map((r, idx) =>
          idx === i
            ? {
                ...r,
                error: error instanceof Error ? error.message : "Failed",
                status: "failed",
              }
            : r,
        );
        setResults(workingResults);

        if (error instanceof Error && error.message.includes("Rate limit")) {
          return;
        }
      }

      if (!isCancelledRef.current && i < imageUris.length - 1) {
        await sleep(BETWEEN_REQUEST_DELAY_MS);
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(false);

    setTimeout(() => {
      if (isCancelledRef.current) return;
      const finalResults = workingResults.map((r) => {
        if (r.status === "pending" || r.status === "processing") {
          return { ...r, status: "failed" as const, error: "Not processed" };
        }
        return r;
      });

      navigation.replace("BatchMockupResult", {
        results: finalResults,
        mockupType: mockupItem.label,
        sceneVibe,
        cameraOption,
        modelOption,
        customScenePrompt,
        negativePrompt,
        customDescription,
        mockupItem,
        mockupColor,
        useCase,
        adStyle,
        productCategoryId,
        desiredMockup,
        templatePrompt,
        productMaterial,
        productSize,
        hasDesign,
        sceneType,
        sceneSetting,
      });
    }, 1000);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ProcessingResult;
    index: number;
  }) => (
    <View style={styles.thumbnailContainer}>
      <Image source={{ uri: item.originalUri }} style={styles.thumbnail} />
      <View
        style={[
          styles.statusOverlay,
          item.status === "completed" && styles.statusCompleted,
          item.status === "failed" && styles.statusFailed,
          item.status === "processing" && styles.statusProcessing,
        ]}
      >
        {item.status === "completed" && (
          <Feather name="check" size={20} color="#FFF" />
        )}
        {item.status === "failed" && (
          <Feather name="x" size={20} color="#FFF" />
        )}
        {item.status === "processing" && <View style={styles.processingDot} />}
      </View>
    </View>
  );

  return (
    <GradientBackground theme="processing">
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
          <ProgressRing progress={progress} size={120} strokeWidth={8} />

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard style={styles.statusCard}>
              <ThemedText style={styles.statusText}>{statusText}</ThemedText>
              <ThemedText style={styles.progressText}>
                {completedCount + failedCount} / {totalCount}
              </ThemedText>
              <ThemedText style={styles.detailText}>{detailText}</ThemedText>
            </GlassCard>
          </Animated.View>

          {showRetry && (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <GradientButton
                title="Try Again"
                icon="refresh-cw"
                onPress={() => processAllImages(true)}
                fullWidth
                style={styles.retryButton}
              />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(item) => item.originalUri}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
            />
          </Animated.View>

          <ProcessingTips
            tips={DEFAULT_PROCESSING_TIPS}
            style={styles.tipsContainer}
          />
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: Spacing["2xl"],
  },
  statusCard: {
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    minWidth: 250,
  },
  retryButton: {
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  detailText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  thumbnailList: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  thumbnailContainer: {
    position: "relative",
    width: 60,
    height: 60,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  statusCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.7)",
  },
  statusFailed: {
    backgroundColor: "rgba(239, 68, 68, 0.7)",
  },
  statusProcessing: {
    backgroundColor: "rgba(249, 115, 22, 0.5)",
  },
  processingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFF",
  },
  tipsContainer: {
    marginTop: Spacing.xl,
    width: "100%",
  },
});
