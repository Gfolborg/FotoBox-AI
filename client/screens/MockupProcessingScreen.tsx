import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Image, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
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
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";

type MockupProcessingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MockupProcessing"
>;

type MockupProcessingScreenRouteProp = RouteProp<
  RootStackParamList,
  "MockupProcessing"
>;

export default function MockupProcessingScreen() {
  const navigation = useNavigation<MockupProcessingScreenNavigationProp>();
  const route = useRoute<MockupProcessingScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { requiresWatermark, consumeCredit } = useCredits();
  const { token } = useAuth();

  const {
    imageUri,
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
    platform,
  } = route.params;

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Preparing your mockup...");
  const [showRetry, setShowRetry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

  const showAuthPrompt = () => {
    Alert.alert(
      "Sign in required",
      "Please sign in to generate mockups.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign in",
          onPress: () => {
            setAuthRedirect({ name: "MockupProcessing", params: route.params });
            navigation.navigate("Auth");
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    processMockup();
  }, []);

  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const processMockup = async () => {
    if (isProcessing) return;
    try {
      if (isCancelledRef.current) return;
      setIsProcessing(true);
      setShowRetry(false);
      setProgress(10);
      setStatus("Uploading image...");

      const manipulated = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 0.95,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const formData = new FormData();
      formData.append("file", {
        uri: manipulated.uri,
        name: "product.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

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
        platform,
      );
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
      if (platform) {
        formData.append("platform", platform);
      }

      setProgress(30);
      setStatus("Creating your mockup with AI...");

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const mockupUrl = new URL("/api/mockup", getApiUrl());
      if (platform) {
        mockupUrl.searchParams.set("platform", platform);
      }
      if (requiresWatermark) {
        mockupUrl.searchParams.set("applyWatermark", "true");
      }
      if (!token) {
        throw new Error("Authentication required");
      }
      const MAX_RETRIES = 3;
      const BASE_DELAY_MS = 2000;
      const MAX_DELAY_MS = 15000;
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      const isRateLimitError = (statusCode: number | null, data: unknown) => {
        if (statusCode === 429) return true;
        if (!data || typeof data !== "object") return false;
        const maybeError = (data as { error?: { code?: number; status?: string } }).error;
        return maybeError?.code === 429 || maybeError?.status === "RESOURCE_EXHAUSTED";
      };

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
              setStatus(
                `Rate limit reached. Retrying in ${Math.ceil(delay / 1000)}s (attempt ${attempt}/${MAX_RETRIES})...`,
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

      setProgress(70);
      setStatus("Finalizing result...");

      const data = await response.json();

      if (isCancelledRef.current) return;
      
      // Consume a credit for successful generation
      await consumeCredit("mockup");
      
      setProgress(100);
      setStatus("Complete!");
      setIsProcessing(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        if (isCancelledRef.current) return;
        navigation.replace("MockupResult", {
          resultUri: data.resultUri,
          originalUri: imageUri,
          mockupType: mockupItem.label,
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
          platform,
        });
      }, 500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setIsProcessing(false);
        return;
      }
      if (isCancelledRef.current) return;
      if (error instanceof Error && error.message === "Authentication required") {
        showAuthPrompt();
        setStatus("Sign in required");
        setIsProcessing(false);
        return;
      }
      console.error("Mockup processing error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus(error instanceof Error ? error.message : "Processing failed");
      setIsProcessing(false);
      setShowRetry(true);
    }
  };

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
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.overlayContainer}>
              <ProgressRing progress={progress} size={100} strokeWidth={6} />
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard style={styles.statusCard}>
              <ThemedText style={styles.statusText}>{status}</ThemedText>
              <ThemedText style={styles.progressText}>
                {Math.round(progress)}%
              </ThemedText>
            </GlassCard>
          </Animated.View>

          {showRetry && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <GradientButton
                title="Try Again"
                icon="refresh-cw"
                onPress={() => {
                  setProgress(0);
                  setStatus("Preparing your mockup...");
                  processMockup();
                }}
                fullWidth
                style={styles.retryButton}
              />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Product</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {mockupItem.label}
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Style</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {sceneVibe.label}
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText style={styles.detailLabel}>Camera</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {cameraOption.label}
                </ThemedText>
              </View>
            </View>
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
  imageContainer: {
    position: "relative",
    width: 250,
    height: 250,
    marginBottom: Spacing.xl,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xl,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCard: {
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    minWidth: 250,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  detailsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  retryButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },
  tipsContainer: {
    marginTop: Spacing.xl,
    width: "100%",
  },
});
