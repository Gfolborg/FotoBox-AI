import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import pLimit from 'p-limit'; // Import p-limit

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
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
    })),
  );

  useEffect(() => {
    processImages();
    // Run once on mount - processImages uses current closure values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processImages = async () => {
    const limit = pLimit(5); // Limit to 5 concurrent operations

    const processingPromises = imageUris.map((uri, i) =>
      limit(() => processImage(uri, i))
    );

    await Promise.all(processingPromises);

    // Use callback to get the most up-to-date results
    setResults((finalResults) => {
      navigation.replace("BatchResult", { results: finalResults });
      return finalResults;
    });
  };

  const processImage = async (imageUri: string, index: number) => {
    setResults((prev) =>
      prev.map((r, idx) =>
        idx === index ? { ...r, status: "processing" as const } : r,
      ),
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
      console.log(
        `[BatchProcessing] Image ${index + 1} - Background Color:`,
        backgroundColor,
      );
      console.log(
        `[BatchProcessing] Image ${index + 1} - API Endpoint:`,
        endpoint,
      );

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
          idx === index ? { ...r, resultUri, status: "completed" as const } : r,
        ),
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setResults((prev) =>
        prev.map((r, idx) =>
          idx === index
            ? {
                ...r,
                status: "failed" as const,
                error: errorMessage,
              }
            : r,
        ),
      );
    }
  };

  const completedCount = results.filter((r) => r.status === "completed").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const processedCount = completedCount + failedCount;
  const progressPercentage = (processedCount / imageUris.length) * 100;

  // Animated progress bar glow
  const progressGlow = useSharedValue(0);
  useEffect(() => {
    progressGlow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progressGlow]);

  const progressGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progressGlow.value * 0.4,
  }));

  return (
    <GradientBackground variant="warm">
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <ThemedText type="h3">Processing Images</ThemedText>
        <ThemedText type="body" style={styles.progress}>
          {processedCount} / {imageUris.length} complete
        </ThemedText>
      </Animated.View>

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: `${progressPercentage}%` },
            progressGlowStyle,
          ]}
        />
      </View>

      <ScrollView
        style={styles.imageList}
        contentContainerStyle={styles.listContent}
      >
        {results.map((result, index) => (
          <Animated.View
            key={result.originalUri}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={styles.imageRow}
          >
            <Image
              source={{ uri: result.originalUri }}
              style={styles.thumbnail}
            />
            <View style={styles.statusContainer}>
              {result.status === "pending" && (
                <ThemedText type="small" style={styles.statusText}>
                  Waiting...
                </ThemedText>
              )}
              {result.status === "processing" && (
                <View style={styles.processingRow}>
                  <ActivityIndicator
                    size="small"
                    color={Colors.light.primary}
                  />
                  <ThemedText type="small" style={styles.statusText}>
                    Processing...
                  </ThemedText>
                </View>
              )}
              {result.status === "completed" && (
                <Feather
                  name="check-circle"
                  size={20}
                  color={Colors.light.success}
                />
              )}
              {result.status === "failed" && (
                <View style={styles.errorContainer}>
                  <Feather
                    name="x-circle"
                    size={20}
                    color={Colors.light.error}
                  />
                  <ThemedText type="small" style={styles.errorText}>
                    {result.error}
                  </ThemedText>
                </View>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.note}>
        <ThemedText type="small" style={styles.noteText}>
          AI is removing backgrounds and creating listing-ready images...
        </ThemedText>
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: "center",
  },
  progress: {
    marginTop: Spacing.xs,
    color: Colors.light.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.light.border,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
  },
  imageList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.border,
  },
  statusContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  statusText: {
    color: Colors.light.textSecondary,
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.light.error,
    flex: 1,
  },
  note: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  noteText: {
    textAlign: "center",
    color: Colors.light.textSecondary,
  },
});
