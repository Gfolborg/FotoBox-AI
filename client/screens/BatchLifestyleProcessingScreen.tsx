import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Image, Dimensions, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { ProcessingTips, DEFAULT_PROCESSING_TIPS } from "@/components/ProcessingTips";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_SIZE = Math.min(SCREEN_WIDTH * 0.5, 300);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "BatchLifestyleProcessing">;

interface ProcessingResult {
  originalUri: string;
  resultUri: string | null;
  error?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export default function BatchLifestyleProcessingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { requiresWatermark, consumeCredit } = useCredits();
  const { token } = useAuth();
  const {
    imageUris,
    environment,
    isCustom,
    productDescription,
    shadowControl,
    platform,
  } = route.params;

  const [results, setResults] = useState<ProcessingResult[]>(
    imageUris.map((uri) => ({
      originalUri: uri,
      resultUri: null,
      status: "pending",
    })),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusText, setStatusText] = useState("Creating lifestyle scenes...");
  const [showRetry, setShowRetry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const resultsRef = useRef<ProcessingResult[]>([]);
  const abortControllersRef = useRef<AbortController[]>([]);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (!processingRef.current) {
      processingRef.current = true;
      processImages();
    }
  }, []);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current = [];
    };
  }, []);

  const processImages = async (resume: boolean = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowRetry(false);
    setStatusText(resume ? "Resuming lifestyle scenes..." : "Creating lifestyle scenes...");

    resultsRef.current =
      resume && resultsRef.current.length === imageUris.length
        ? [...resultsRef.current]
        : imageUris.map((uri) => ({
            originalUri: uri,
            resultUri: null,
            status: "pending" as const,
          }));

    if (!resume) {
      setResults([...resultsRef.current]);
    }

    for (let i = 0; i < imageUris.length; i++) {
      if (isCancelledRef.current) return;
      if (resultsRef.current[i]?.status === "completed") {
        continue;
      }
      setCurrentIndex(i);
      resultsRef.current[i] = {
        ...resultsRef.current[i],
        status: "processing",
      };
      setResults([...resultsRef.current]);

      try {
        const resultUri = await processImage(imageUris[i]);
        if (isCancelledRef.current) return;
        
        // Consume a credit for successful generation
        await consumeCredit("lifestyle-scene");
        
        resultsRef.current[i] = {
          ...resultsRef.current[i],
          resultUri,
          status: "completed",
        };
        setResults([...resultsRef.current]);
      } catch (error) {
        if (isCancelledRef.current) return;
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        resultsRef.current[i] = {
          ...resultsRef.current[i],
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        };
        setResults([...resultsRef.current]);

        if (error instanceof Error && error.message.toLowerCase().includes("rate limit")) {
          setShowRetry(true);
          setStatusText(error.message);
          setIsProcessing(false);
          return;
        }
      }
    }

    if (isCancelledRef.current) return;
    setIsProcessing(false);
    setTimeout(() => {
      if (isCancelledRef.current) return;
      navigation.replace("BatchLifestyleResult", {
        results: resultsRef.current.map((r) => ({
          ...r,
          resultUri: r.status === "completed" ? r.resultUri : null,
        })),
        environment,
        isCustom,
        productDescription,
        shadowControl,
        platform,
      });
    }, 500);
  };

  const processImage = async (imageUri: string): Promise<string> => {
    if (isCancelledRef.current) {
      throw new Error("Cancelled");
    }
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      name: "product_photo.jpg",
      type: "image/jpeg",
    } as unknown as Blob);

    const apiUrl = getApiUrl();
    let endpoint = `${apiUrl}api/lifestyle-scene`;
    const params = new URLSearchParams();
    params.append("environment", environment);
    if (isCustom) {
      params.append("isCustom", "true");
    }

    if (productDescription) {
      params.append("productDescription", productDescription);
    }
    if (shadowControl && shadowControl !== "natural") {
      params.append("shadowControl", shadowControl);
    }
    if (platform) {
      params.append("platform", platform);
    }
    if (requiresWatermark) {
      params.append("applyWatermark", "true");
    }

    endpoint += `?${params.toString()}`;

    if (!token) {
      Alert.alert(
        "Sign in required",
        "Please sign in to generate lifestyle scenes.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign in",
            onPress: () => {
              setAuthRedirect({ name: "BatchLifestyleProcessing", params: route.params });
              navigation.navigate("Auth");
            },
          },
        ],
      );
      throw new Error("Authentication required");
    }

    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const MAX_RETRIES = 3;
      const BASE_DELAY_MS = 2000;
      const MAX_DELAY_MS = 15000;
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const isRateLimitError = (statusCode: number | null, bodyText?: string) => {
        if (statusCode === 429) return true;
        if (!bodyText) return false;
        const lower = bodyText.toLowerCase();
        return (
          lower.includes("resource_exhausted") ||
          lower.includes("rate limit") ||
          lower.includes("429")
        );
      };

      const fetchWithRetry = async () => {
        for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
          if (isCancelledRef.current) return null;
          const response = await fetch(endpoint, {
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

          const errorText = await response.text();
          if (isRateLimitError(response.status, errorText)) {
            if (attempt <= MAX_RETRIES) {
              const delay = Math.min(
                BASE_DELAY_MS * Math.pow(2, attempt - 1),
                MAX_DELAY_MS,
              );
              setStatusText(
                `Rate limit reached. Retrying in ${Math.ceil(delay / 1000)}s (attempt ${attempt}/${MAX_RETRIES})...`,
              );
              await sleep(delay);
              continue;
            }
            throw new Error("Rate limit reached. Please try again in a minute.");
          }

          throw new Error(errorText || "Failed to generate lifestyle scene");
        }
        return null;
      };

      const response = await fetchWithRetry();
      clearTimeout(timeoutId);
      if (!response) {
        throw new Error("Request cancelled");
      }

      setStatusText("Creating lifestyle scenes...");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(blob);
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const completedCount = results.filter((r) => r.status === "completed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const progress = (completedCount + failedCount) / imageUris.length;

  return (
    <GradientBackground
      theme="processing"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <ThemedText style={styles.title}>
            Creating Lifestyle Scenes
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {completedCount + failedCount} of {imageUris.length} completed
          </ThemedText>
          <ThemedText style={styles.statusText}>{statusText}</ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={styles.progressContainer}
        >
          <ProgressRing
            progress={progress}
            size={120}
            strokeWidth={8}
            color={Colors.editing.primary}
            backgroundColor={Colors.editing.border}
          >
            <ThemedText style={styles.progressText}>
              {Math.round(progress * 100)}%
            </ThemedText>
          </ProgressRing>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.currentContainer}
        >
          <GlassCard theme="light" padding="lg" borderRadius="xl">
            <View style={styles.currentContent}>
              <View style={styles.imagePreview}>
                <Image
                  source={{ uri: imageUris[currentIndex] }}
                  style={styles.previewImage}
                />
                {results[currentIndex]?.status === "processing" && (
                  <View style={styles.processingOverlay}>
                    <Feather
                      name="zap"
                      size={32}
                      color={Colors.editing.primary}
                    />
                  </View>
                )}
              </View>
              <View style={styles.statusInfo}>
                <ThemedText style={styles.statusLabel}>
                  Processing image {currentIndex + 1}
                </ThemedText>
                <ThemedText style={styles.environmentText}>
                  {environment.length > 40
                    ? environment.slice(0, 40) + "..."
                    : environment}
                </ThemedText>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(600).duration(400)}
          style={styles.estimateContainer}
        >
          <Feather
            name="clock"
            size={16}
            color={Colors.editing.textSecondary}
          />
          <ThemedText style={styles.estimateText}>
            ~{(imageUris.length - completedCount - failedCount) * 15}s remaining
          </ThemedText>
        </Animated.View>

        {showRetry && (
          <Animated.View entering={FadeInUp.delay(700).duration(400)}>
            <GradientButton
              title="Try Again"
              icon="refresh-cw"
              onPress={() => processImages(true)}
              fullWidth
              style={styles.retryButton}
            />
          </Animated.View>
        )}

        <ProcessingTips
          tips={DEFAULT_PROCESSING_TIPS}
          style={styles.tipsContainer}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.editing.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.editing.textSecondary,
  },
  statusText: {
    fontSize: 13,
    color: Colors.editing.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  progressText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.editing.text,
  },
  currentContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  currentContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.editing.text,
    marginBottom: Spacing.xs,
  },
  environmentText: {
    fontSize: 13,
    color: Colors.editing.textSecondary,
  },
  estimateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  estimateText: {
    fontSize: 14,
    color: Colors.editing.textSecondary,
  },
  retryButton: {
    marginTop: Spacing.lg,
    width: "100%",
  },
  tipsContainer: {
    marginTop: Spacing.lg,
    width: "100%",
  },
});
