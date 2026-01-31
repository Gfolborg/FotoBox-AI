import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedHeader } from "@/components/ThemedHeader";
import { ThemedText } from "@/components/ThemedText";
import { GradientButton } from "@/components/GradientButton";
import { GlassCard } from "@/components/GlassCard";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { GradientBackground } from "@/components/GradientBackground";
import { ProgressRing } from "@/components/ProgressRing";
import { IterateSheet } from "@/components/IterateSheet";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useBatchEdit } from "@/context/BatchEditContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH - Spacing.lg * 2;
const MAX_IMAGE_HEIGHT = SCREEN_HEIGHT * 0.55;

export type ResultScreenWorkingLabels = {
  retryTitle: string;
  retryHint: string;
  iterateTitle: string;
  iterateHint: string;
};

type ResultScreenLayoutProps = {
  title: string;
  initialResultUri: string;
  originalUri: string;
  onRetry: () => Promise<string>;
  onIterate: (notes: string, currentResultUri: string) => Promise<string>;
  onEdit: (resultUri: string) => void | Promise<void>;
  onContinue: (resultUri: string) => void | Promise<void>;
  onGenerateAnother: () => void;
  workingLabels?: ResultScreenWorkingLabels;
};

const DEFAULT_WORKING_LABELS: ResultScreenWorkingLabels = {
  retryTitle: "Regenerating",
  retryHint: "This may take up to 30 seconds",
  iterateTitle: "Refining",
  iterateHint: "Applying your changes",
};

export function ResultScreenLayout({
  title,
  initialResultUri,
  originalUri,
  onRetry,
  onIterate,
  onEdit,
  onContinue,
  onGenerateAnother,
  workingLabels = DEFAULT_WORKING_LABELS,
}: ResultScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [resultUri, setResultUri] = useState(initialResultUri);
  const [showComparison, setShowComparison] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isIterateOpen, setIsIterateOpen] = useState(false);
  const [iterateNotes, setIterateNotes] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { pendingEditResult, setPendingEditResult } = useBatchEdit();

  useFocusEffect(
    useCallback(() => {
      if (pendingEditResult && pendingEditResult.originalUri === originalUri) {
        setResultUri(pendingEditResult.editedUri);
        setPendingEditResult(null);
      }
    }, [pendingEditResult, originalUri, setPendingEditResult]),
  );

  const handleRetry = async () => {
    if (isRetrying || isIterating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRetrying(true);

    try {
      const newResultUri = await onRetry();
      if (newResultUri) {
        setResultUri(newResultUri);
      }
      setShowComparison(false);
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      });
    } catch (error) {
      console.error("Retry generation failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web" && message !== "No credits remaining") {
        Alert.alert("Generation Failed", message);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleOpenIterate = () => {
    if (isRetrying || isIterating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsIterateOpen(true);
  };

  const handleIterateSubmit = async () => {
    const notes = iterateNotes.trim();
    if (!notes || isIterating || isRetrying) return;
    setIsIterating(true);
    setIsIterateOpen(false);

    try {
      const newResultUri = await onIterate(notes, resultUri);
      if (newResultUri) {
        setResultUri(newResultUri);
      }
      setShowComparison(false);
      setIterateNotes("");
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      });
    } catch (error) {
      console.error("Iterate generation failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      if (Platform.OS !== "web" && message !== "No credits remaining") {
        Alert.alert("Iteration Failed", message);
      }
    } finally {
      setIsIterating(false);
    }
  };

  const handleEdit = () => {
    onEdit(resultUri);
  };

  const handleContinue = () => {
    onContinue(resultUri);
  };

  const displayHeight = imageDimensions
    ? Math.min(
        (IMAGE_SIZE * imageDimensions.height) / imageDimensions.width,
        MAX_IMAGE_HEIGHT,
      )
    : IMAGE_SIZE;

  const actionCardGradients = {
    edit: ["rgba(14, 165, 233, 0.28)", "rgba(59, 130, 246, 0.45)"],
    retry: ["rgba(249, 115, 22, 0.28)", "rgba(234, 88, 12, 0.45)"],
    new: ["rgba(16, 185, 129, 0.28)", "rgba(34, 197, 94, 0.45)"],
    iterate: ["rgba(20, 184, 166, 0.25)", "rgba(13, 148, 136, 0.45)"],
  };

  const isWorking = isRetrying || isIterating;
  const workingTitle = isIterating
    ? workingLabels.iterateTitle
    : workingLabels.retryTitle;
  const workingHint = isIterating
    ? workingLabels.iterateHint
    : workingLabels.retryHint;

  useEffect(() => {
    let isMounted = true;
    Image.getSize(
      resultUri,
      (width, height) => {
        if (isMounted) {
          setImageDimensions({ width, height });
        }
      },
      () => {
        if (isMounted) {
          setImageDimensions(null);
        }
      },
    );
    return () => {
      isMounted = false;
    };
  }, [resultUri]);

  return (
    <GradientBackground theme="home">
      <StatusBar style="dark" />

      <ThemedHeader title={title} />

      <View style={[styles.container, { paddingTop: insets.top + 54 }]}> 
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 240 },
          ]}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          bounces={scrollEnabled}
          onContentSizeChange={(_, height) => {
            if (containerHeight) {
              setScrollEnabled(height > containerHeight + 16);
            }
          }}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setContainerHeight(height);
          }}
        >
          {showComparison ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <BeforeAfterSlider
                beforeImage={originalUri}
                afterImage={resultUri}
                size={IMAGE_SIZE}
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              exiting={FadeOut.duration(200)}
              style={[styles.imageContainer, { height: displayHeight }]}
            >
              <Image source={{ uri: resultUri }} style={styles.resultImage} />
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInUp.delay(200).duration(400)}
            style={styles.carouselContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionCarousel}
            >
              <Pressable style={styles.actionCard} onPress={handleEdit}>
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
                style={[styles.actionCard, isWorking && styles.actionCardDisabled]}
                onPress={handleRetry}
                disabled={isWorking}
              >
                <LinearGradient
                  colors={actionCardGradients.retry}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  <Feather name="refresh-cw" size={18} color={Colors.editing.text} />
                </View>
                <ThemedText style={styles.actionCardLabel}>
                  {isRetrying ? "Retrying..." : "Retry"}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.actionCard, isWorking && styles.actionCardDisabled]}
                onPress={handleOpenIterate}
                disabled={isWorking}
              >
                <LinearGradient
                  colors={actionCardGradients.iterate}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  <Feather name="repeat" size={18} color={Colors.editing.text} />
                </View>
                <ThemedText style={styles.actionCardLabel}>Iterate</ThemedText>
              </Pressable>

              <Pressable style={styles.actionCard} onPress={onGenerateAnother}>
                <LinearGradient
                  colors={actionCardGradients.new}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionCardGradient}
                />
                <View style={styles.actionIconContainer}>
                  <Feather name="plus" size={18} color={Colors.editing.text} />
                </View>
                <ThemedText style={styles.actionCardLabel}>New</ThemedText>
              </Pressable>
            </ScrollView>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            style={styles.toggleContainer}
          >
            <Pressable
              style={[
                styles.toggleButton,
                showComparison && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setShowComparison(!showComparison);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather
                name={showComparison ? "eye" : "sliders"}
                size={16}
                color={
                  showComparison ? Colors.editing.text : Colors.editing.textSecondary
                }
              />
              <ThemedText
                style={[
                  styles.toggleText,
                  showComparison && styles.toggleTextActive,
                ]}
              >
                {showComparison ? "View Result" : "Compare"}
              </ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          <GlassCard theme="light" padding="sm" borderRadius="lg">
            <View style={styles.actionButtons}>
              <GradientButton
                title="Continue"
                onPress={handleContinue}
                icon="arrow-right"
                fullWidth
              />
            </View>
          </GlassCard>
        </Animated.View>

        {isWorking && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.retryOverlay}>
            <GlassCard
              theme="dark"
              variant="solid"
              padding="xl"
              borderRadius="2xl"
              style={styles.retryCard}
            >
              <View style={styles.retryContent}>
                <ProgressRing
                  progress={0.7}
                  size={90}
                  strokeWidth={7}
                  color={Colors.editing.primary}
                  backgroundColor="rgba(255, 255, 255, 0.1)"
                >
                  <ActivityIndicator size="small" color={Colors.editing.primary} />
                </ProgressRing>
                <ThemedText style={styles.retryTitle}>{workingTitle}</ThemedText>
                <ThemedText style={styles.retryHint}>{workingHint}</ThemedText>
              </View>
            </GlassCard>
          </Animated.View>
        )}
      </View>

      <IterateSheet
        isOpen={isIterateOpen}
        value={iterateNotes}
        onChange={setIterateNotes}
        onClose={() => setIsIterateOpen(false)}
        onSubmit={handleIterateSubmit}
        isSubmitting={isIterating}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    maxHeight: MAX_IMAGE_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.editing.backgroundSecondary,
    ...Shadows.lg,
  },
  resultImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  carouselContainer: {
    marginTop: Spacing.lg,
  },
  toggleContainer: {
    marginTop: Spacing.md,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.editing.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.editing.border,
  },
  toggleButtonActive: {
    backgroundColor: Colors.editing.primary,
    borderColor: Colors.editing.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.editing.textSecondary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  actionCarousel: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  actionCard: {
    width: 96,
    height: 96,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.editing.text,
  },
  retryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.editing.overlayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  retryCard: {
    width: "80%",
  },
  retryContent: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  retryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.editing.text,
    marginTop: Spacing.sm,
  },
  retryHint: {
    fontSize: 13,
    color: Colors.editing.textSecondary,
    textAlign: "center",
  },
});
