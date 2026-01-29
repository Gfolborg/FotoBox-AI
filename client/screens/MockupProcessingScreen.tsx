import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Image } from "react-native";
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
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";

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
  } = route.params;

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Preparing your mockup...");
  const hasStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef(false);

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
    try {
      if (isCancelledRef.current) return;
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

      setProgress(30);
      setStatus("Creating your mockup with AI...");

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await fetch(
        new URL("/api/mockup", getApiUrl()).toString(),
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        },
      );

      setProgress(70);
      setStatus("Finalizing result...");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create mockup");
      }

      const data = await response.json();

      if (isCancelledRef.current) return;
      setProgress(100);
      setStatus("Complete!");

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
        });
      }, 500);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      if (isCancelledRef.current) return;
      console.error("Mockup processing error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus(error instanceof Error ? error.message : "Processing failed");
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
