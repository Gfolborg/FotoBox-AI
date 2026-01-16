import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import pLimit from "p-limit";

import { ThemedText } from "@/components/ThemedText";
import { GlassPill } from "@/components/GlassPill";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BatchProcessing"
>;
type RouteProps = RouteProp<RootStackParamList, "BatchProcessing">;

interface ProcessingResult {
  originalUri: string;
  resultUri: string | null;
  error?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export default function BatchProcessingScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { imageUris, backgroundColor = "#FFFFFF" } = route.params;

  const [results, setResults] = useState<ProcessingResult[]>(
    imageUris.map((uri) => ({
      originalUri: uri,
      resultUri: null,
      status: "pending" as const,
    }))
  );
  const [isComplete, setIsComplete] = useState(false);
  const resultsRef = useRef<ProcessingResult[]>(results);

  // Keep ref in sync with state
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Navigate when processing is complete
  useEffect(() => {
    if (isComplete) {
      navigation.replace("BatchResult", { results: resultsRef.current });
    }
  }, [isComplete, navigation]);

  useEffect(() => {
    processImages();
  }, []);

  const processImages = async () => {
    const limit = pLimit(5);

    const processingPromises = imageUris.map((uri, i) =>
      limit(() => processImage(uri, i))
    );

    await Promise.all(processingPromises);

    // Signal completion - navigation happens in useEffect
    setIsComplete(true);
  };

  const processImage = async (imageUri: string, index: number) => {
    setResults((prev) =>
      prev.map((r, idx) =>
        idx === index ? { ...r, status: "processing" as const } : r
      )
    );

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: `product_photo_${index}.jpg`,
        type: "image/jpeg",
      } as unknown as Blob);

      const apiUrl = getApiUrl();
      const bgColorParam = encodeURIComponent(backgroundColor);
      const endpoint = `${apiUrl}api/amazon-main?backgroundColor=${bgColorParam}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      const resultUri = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setResults((prev) =>
        prev.map((r, idx) =>
          idx === index ? { ...r, resultUri, status: "completed" as const } : r
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setResults((prev) =>
        prev.map((r, idx) =>
          idx === index
            ? { ...r, status: "failed" as const, error: errorMessage }
            : r
        )
      );
    }
  };

  const completedCount = results.filter((r) => r.status === "completed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const processedCount = completedCount + failedCount;
  const progress = processedCount / imageUris.length;

  const pulseOpacity = useSharedValue(0.4);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <BlurView intensity={40} tint="light" style={styles.headerBlur} />
        <View style={styles.headerContent}>
          <GlassPill>
            <Feather name="cpu" size={16} color={Colors.editing.primary} />
            <ThemedText style={styles.headerTitle}>Processing</ThemedText>
          </GlassPill>
        </View>
      </Animated.View>

      {/* Progress Ring Section */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.progressSection}>
        <ProgressRing
          progress={progress}
          size={140}
          strokeWidth={8}
          color={Colors.editing.primary}
          backgroundColor="rgba(255, 255, 255, 0.1)"
        >
          <View style={styles.progressContent}>
            <ThemedText style={styles.progressNumber}>
              {Math.round(progress * 100)}%
            </ThemedText>
            <ThemedText style={styles.progressLabel}>
              {processedCount} / {imageUris.length}
            </ThemedText>
          </View>
        </ProgressRing>

        <Animated.View style={[styles.processingHint, pulseStyle]}>
          <Feather name="zap" size={14} color={Colors.editing.primary} />
          <ThemedText style={styles.hintText}>
            AI is removing backgrounds...
          </ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Image List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {results.map((result, index) => (
          <Animated.View
            key={result.originalUri}
            entering={FadeInUp.delay(200 + index * 60).duration(400)}
          >
            <GlassCard theme="light" padding="md" borderRadius="lg" style={styles.imageCard}>
              <View style={styles.imageRow}>
                <Image
                  source={{ uri: result.originalUri }}
                  style={styles.thumbnail}
                />
                <View style={styles.statusContainer}>
                  <ThemedText style={styles.imageName} numberOfLines={1}>
                    Image {index + 1}
                  </ThemedText>
                  {result.status === "pending" && (
                    <View style={styles.statusRow}>
                      <View style={styles.pendingDot} />
                      <ThemedText style={styles.statusText}>Waiting...</ThemedText>
                    </View>
                  )}
                  {result.status === "processing" && (
                    <View style={styles.statusRow}>
                      <Animated.View style={pulseStyle}>
                        <Feather name="loader" size={14} color={Colors.editing.primary} />
                      </Animated.View>
                      <ThemedText style={[styles.statusText, styles.processingText]}>
                        Processing...
                      </ThemedText>
                    </View>
                  )}
                  {result.status === "completed" && (
                    <View style={styles.statusRow}>
                      <Feather name="check-circle" size={16} color={Colors.editing.success} />
                      <ThemedText style={[styles.statusText, styles.successText]}>
                        Complete
                      </ThemedText>
                    </View>
                  )}
                  {result.status === "failed" && (
                    <View style={styles.statusRow}>
                      <Feather name="x-circle" size={16} color={Colors.editing.error} />
                      <ThemedText style={[styles.statusText, styles.errorText]} numberOfLines={1}>
                        {result.error || "Failed"}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.editing.backgroundRoot,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    alignItems: "center",
  },
  headerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.editing.text,
    fontSize: 15,
    fontWeight: "600",
  },
  progressSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  progressContent: {
    alignItems: "center",
  },
  progressNumber: {
    color: Colors.editing.text,
    fontSize: 28,
    fontWeight: "700",
  },
  progressLabel: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
  },
  processingHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  hintText: {
    color: Colors.editing.textSecondary,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  imageCard: {
    marginBottom: 0,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  statusContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  imageName: {
    color: Colors.editing.text,
    fontSize: 14,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.editing.textTertiary,
  },
  statusText: {
    color: Colors.editing.textSecondary,
    fontSize: 13,
  },
  processingText: {
    color: Colors.editing.primary,
  },
  successText: {
    color: Colors.editing.success,
  },
  errorText: {
    color: Colors.editing.error,
    flex: 1,
  },
});
