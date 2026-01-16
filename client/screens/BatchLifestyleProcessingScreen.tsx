import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_SIZE = Math.min(SCREEN_WIDTH * 0.5, 200);

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
  const { imageUris, environment, productDescription, shadowControl } = route.params;

  const [results, setResults] = useState<ProcessingResult[]>(
    imageUris.map((uri) => ({
      originalUri: uri,
      resultUri: null,
      status: "pending",
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!processingRef.current) {
      processingRef.current = true;
      processImages();
    }
  }, []);

  const processImages = async () => {
    for (let i = 0; i < imageUris.length; i++) {
      setCurrentIndex(i);
      setResults((prev) =>
        prev.map((r, idx) =>
          idx === i ? { ...r, status: "processing" } : r
        )
      );

      try {
        const resultUri = await processImage(imageUris[i]);
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, resultUri, status: "completed" } : r
          )
        );
      } catch (error) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "failed", error: error instanceof Error ? error.message : "Unknown error" }
              : r
          )
        );
      }
    }

    setTimeout(() => {
      navigation.replace("BatchLifestyleResult", {
        results: results.map((r, idx) => ({
          ...r,
          resultUri: r.status === "completed" ? r.resultUri : null,
        })),
        environment,
      });
    }, 500);
  };

  const processImage = async (imageUri: string): Promise<string> => {
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

    if (productDescription) {
      params.append("productDescription", productDescription);
    }
    if (shadowControl && shadowControl !== "natural") {
      params.append("shadowControl", shadowControl);
    }

    endpoint += `?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate lifestyle scene");
      }

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
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <ThemedText style={styles.title}>Creating Lifestyle Scenes</ThemedText>
          <ThemedText style={styles.subtitle}>
            {completedCount + failedCount} of {imageUris.length} completed
          </ThemedText>
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
            backgroundColor="rgba(255, 255, 255, 0.1)"
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
          <Feather name="clock" size={16} color={Colors.editing.textSecondary} />
          <ThemedText style={styles.estimateText}>
            ~{(imageUris.length - completedCount - failedCount) * 15}s remaining
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.editing.backgroundRoot,
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
});
