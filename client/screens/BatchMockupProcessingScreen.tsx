import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Image, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { GradientBackground } from "@/components/GradientBackground";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { getMockupPrompt } from "@/lib/mockup-presets";

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

  const { imageUris, mockupItem, sceneVibe, cameraOption, mockupColor, customDescription } = route.params;

  const [results, setResults] = useState<ProcessingResult[]>(
    imageUris.map((uri) => ({
      originalUri: uri,
      resultUri: null,
      status: "pending",
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasStartedRef = useRef(false);

  const completedCount = results.filter((r) => r.status === "completed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const totalCount = imageUris.length;
  const progress = ((completedCount + failedCount) / totalCount) * 100;

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    processAllImages();
  }, []);

  const processAllImages = async () => {
    const prompt = getMockupPrompt(
      mockupItem,
      sceneVibe,
      cameraOption,
      mockupColor,
      customDescription
    );

    for (let i = 0; i < imageUris.length; i++) {
      setCurrentIndex(i);
      setResults((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, status: "processing" } : r
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", {
          uri: imageUris[i],
          name: `product_${i}.jpg`,
          type: "image/jpeg",
        } as unknown as Blob);
        formData.append("prompt", prompt);
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
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create mockup");
        }

        const data = await response.json();

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, resultUri: data.resultUri, status: "completed" }
              : r
          )
        );

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.error(`Mockup processing error for image ${i}:`, error);
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  error: error instanceof Error ? error.message : "Failed",
                  status: "failed",
                }
              : r
          )
        );
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      const finalResults = results.map((r, idx) => {
        if (r.status === "pending" || r.status === "processing") {
          return { ...r, status: "failed" as const, error: "Not processed" };
        }
        return r;
      });

      navigation.replace("BatchMockupResult", {
        results: finalResults,
        mockupType: mockupItem.label,
      });
    }, 1000);
  };

  const renderItem = ({ item, index }: { item: ProcessingResult; index: number }) => (
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
        {item.status === "processing" && (
          <View style={styles.processingDot} />
        )}
      </View>
    </View>
  );

  return (
    <GradientBackground variant="warm">
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
              <ThemedText style={styles.statusText}>
                Creating mockups...
              </ThemedText>
              <ThemedText style={styles.progressText}>
                {completedCount + failedCount} / {totalCount}
              </ThemedText>
              <ThemedText style={styles.detailText}>
                {mockupItem.label} • {sceneVibe.label}
              </ThemedText>
            </GlassCard>
          </Animated.View>

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
    justifyContent: "center",
    alignItems: "center",
  },
  statusCard: {
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xl,
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
});
