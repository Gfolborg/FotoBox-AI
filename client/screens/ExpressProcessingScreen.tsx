import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GradientBackground } from "@/components/GradientBackground";
import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  buildExpressTasks,
  ExpressResultItem,
} from "@/lib/express-presets";
import { runExpressTask } from "@/lib/express-generation";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/context/AuthContext";
import { setAuthRedirect } from "@/lib/auth-redirect";
import { useNotification } from "@/context/NotificationContext";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ExpressProcessing">;
type RouteProps = RouteProp<RootStackParamList, "ExpressProcessing">;

export default function ExpressProcessingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { requiresWatermark, consumeCredit } = useCredits();
  const { showNotification } = useNotification();

  const {
    imageUri,
    productDescription,
    useCase,
    adStyle,
    platform,
    modelOption,
    customModelDirection,
  } = route.params;

  const tasks = useMemo(
    () =>
      buildExpressTasks({
        productDescription,
        useCase,
        adStyle,
        platform,
        modelOption,
        customModelDirection,
      }),
    [
      productDescription,
      useCase,
      adStyle,
      platform,
      modelOption,
      customModelDirection,
    ],
  );

  const [results, setResults] = useState<ExpressResultItem[]>(
    tasks.map((task) => ({
      ...task,
      status: "pending",
      resultUri: null,
    })),
  );
  const [statusText, setStatusText] = useState("Preparing Express bundle...");
  const [isProcessing, setIsProcessing] = useState(false);

  const hasStartedRef = useRef(false);

  const completedCount = results.filter((item) => item.status === "completed").length;
  const failedCount = results.filter((item) => item.status === "failed").length;
  const doneCount = completedCount + failedCount;
  const totalCount = Math.max(results.length, 1);
  const progressRatio = doneCount / totalCount;
  const progressPercent = Math.round(progressRatio * 100);
  const backgroundDone = results.filter(
    (item) => item.kind === "background" && (item.status === "completed" || item.status === "failed"),
  ).length;
  const lifestyleDone = results.filter(
    (item) => item.kind === "lifestyle" && (item.status === "completed" || item.status === "failed"),
  ).length;
  const mockupDone = results.filter(
    (item) => item.kind === "mockup" && (item.status === "completed" || item.status === "failed"),
  ).length;

  const showAuthPrompt = () => {
    Alert.alert(
      "Sign in required",
      "Please sign in to run Express generation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign in",
          onPress: () => {
            setAuthRedirect({ name: "ExpressProcessing", params: route.params });
            navigation.navigate("Auth");
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    processAll();
  }, []);

  const processAll = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!token) {
      showAuthPrompt();
      setIsProcessing(false);
      return;
    }

    const workingResults = [...results];

    for (let i = 0; i < workingResults.length; i += 1) {
      const item = workingResults[i];
      setStatusText(`Generating ${item.title} (${i + 1}/7)...`);

      workingResults[i] = {
        ...item,
        status: "processing",
        error: undefined,
      };
      setResults([...workingResults]);

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
          throw new Error(creditResult.error || "Insufficient credits to continue Express generation.");
        }
        if (creditResult.creditsRemaining === 1) {
          showNotification("1 credit left! Grab more to keep going.", "warning");
        }

        workingResults[i] = {
          ...item,
          status: "completed",
          resultUri,
          error: undefined,
        };
        setResults([...workingResults]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Generation failed";

        if (message === "Authentication required") {
          showAuthPrompt();
          setIsProcessing(false);
          return;
        }

        workingResults[i] = {
          ...item,
          status: "failed",
          resultUri: null,
          error: message,
        };
        setResults([...workingResults]);
      }
    }

    setStatusText("Express bundle ready");
    setIsProcessing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      navigation.replace("ExpressResult", {
        imageUri,
        productDescription,
        useCase,
        adStyle,
        platform,
        modelOption,
        customModelDirection,
        results: workingResults,
      });
    }, 350);
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
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroSection}>
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.progressOverlay}>
              <ProgressRing progress={progressRatio} size={96} strokeWidth={6}>
                <View style={styles.progressCenterContent}>
                  <ThemedText style={styles.progressPercentText}>
                    {progressPercent}%
                  </ThemedText>
                </View>
              </ProgressRing>
            </View>
          </View>

          <GlassCard style={styles.statusCard}>
            <ThemedText style={styles.title}>Generating Express Bundle</ThemedText>
            <ThemedText style={styles.statusText}>{statusText}</ThemedText>
            <ThemedText style={styles.counterText}>
              {doneCount} / {results.length} complete
            </ThemedText>
            <View style={styles.categoryRow}>
              <View style={styles.categoryChip}>
                <ThemedText style={styles.categoryText}>BG {backgroundDone}/1</ThemedText>
              </View>
              <View style={styles.categoryChip}>
                <ThemedText style={styles.categoryText}>Lifestyle {lifestyleDone}/3</ThemedText>
              </View>
              <View style={styles.categoryChip}>
                <ThemedText style={styles.categoryText}>Mockup {mockupDone}/3</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.infoText}>
              Failed steps are kept and can be retried on the results screen.
            </ThemedText>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.listWrap}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {results.map((item) => {
              const isDone = item.status === "completed" || item.status === "failed";
              const icon =
                item.status === "completed"
                  ? "check"
                  : item.status === "failed"
                    ? "x"
                    : item.status === "processing"
                      ? "loader"
                      : "clock";

              return (
                <View key={item.id} style={styles.itemRow}>
                <View
                  style={[
                    styles.itemIcon,
                    item.status === "completed" && styles.itemIconSuccess,
                    item.status === "failed" && styles.itemIconFailed,
                    item.status === "processing" && styles.itemIconProcessing,
                  ]}
                >
                  {item.status === "processing" ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather
                      name={icon as keyof typeof Feather.glyphMap}
                      size={14}
                      color={isDone ? "#FFFFFF" : Colors.editing.textSecondary}
                    />
                  )}
                </View>
                  <View style={styles.itemTextWrap}>
                    <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.itemSubtitle}>
                      {item.status === "processing"
                        ? "Working..."
                        : item.status === "completed"
                          ? "Completed"
                          : item.status === "failed"
                            ? item.error || "Failed"
                            : "Queued"}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </ScrollView>
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
  heroSection: {
    marginBottom: Spacing.lg,
  },
  previewWrap: {
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  progressCenterContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressPercentText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statusCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statusText: {
    marginTop: Spacing.xs,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  counterText: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: Colors.editing.primary,
    fontWeight: "600",
  },
  categoryRow: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  categoryChip: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600",
  },
  infoText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  listWrap: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.editing.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.editing.backgroundSecondary,
  },
  itemIconSuccess: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  itemIconFailed: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  itemIconProcessing: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  itemTextWrap: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
